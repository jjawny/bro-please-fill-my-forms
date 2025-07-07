import { create } from "zustand";
import { ByoKeyData, ByoKeyDataSchema, DEFAULT_BYO_KEY_DATA } from "~/lib/models/ByoKeyData";
import { err, ErrOr, Messages, ok } from "~/lib/models/ErrOr";
import { DEFAULT_TEMPORARY_DATA, TemporaryData, TemporaryDataSchema } from "~/lib/models/TemporaryData";
import {
  loadTemporaryDataFromSessionStorage,
  saveToSessionStorage,
} from "~/lib/services/chrome-storage-session-service";
import { loadByoKeyDataFromSyncStorage, saveToSyncStorage } from "~/lib/services/chrome-storage-sync-service";
import { decryptData, encryptData } from "~/lib/services/crypto-service";
import { validateApiKey } from "~/lib/services/gemini-service";
import { hash } from "~/lib/utils/hash-utils";
import { logError } from "~/lib/utils/log-utils";

type PinMode = "SETTING_UP" | "LOCKED" | "UNLOCKED";

type PinStore = ByoKeyData &
  TemporaryData & {
    isInitialized: boolean;
    pinMode: PinMode;
    geminiApiKeyDecrypted?: string;
    isGeminiApiKeyDirty: boolean;

    /**
     * Sets the state w any previously saved data
     */
    initialize: () => Promise<ErrOr>;

    /**
     * Attempts to transition to "LOCKED"
     */
    lock: () => Promise<ErrOr>;

    /**
     * Attempts to transition to "UNLOCKED"
     * Success path = given pin is able to decrypt the data
     * Upon success, the pin is saved in session storage (for auto-unlocks)
     */
    unlock: (pin: string) => Promise<ErrOr>;

    /**
     * When "SETTING_UP", users can set the PIN
     * Includes re-encryping the existing/dummy API key
     */
    saveNewPin: (newPin: string) => Promise<ErrOr>;

    /**
     * When "UNLOCKED", users can set the API key
     * Includes hashing, encrypting, and testing the key
     */
    saveNewApiKey: (newKey: string, shouldTest: boolean) => Promise<ErrOr>;

    /**
     * Saves the user input prompt portion into TemporaryData
     */
    savePrompt: (prompt: string) => Promise<ErrOr>;

    /**
     * Resets all data to defaults and transitions to "SETTING_UP"
     */
    reset: () => Promise<ErrOr>;

    /**
     * Signal to components that current API key has not been saved yet
     */
    setIsApiKeyDirty: (isDirty: boolean) => ErrOr;

    /**
     * Get a dump of this store
     */
    GET_DEBUG_DUMP: () => object;
  };

export const usePinStore = create<PinStore>((set, get) => {
  const transitionToLockedMode = async (otherState?: Partial<PinStore>): Promise<ErrOr> => {
    const messages: Messages = ["Begin transitioning to locked mode"];

    try {
      // Clear the PIN so no components attempt auto-unlock
      const pin = null;
      const clearTempDataResponse = await saveToSessionStorage(TemporaryDataSchema, { pin, prompt: get().prompt });

      messages.push(clearTempDataResponse.messages);

      if (!clearTempDataResponse.isOk) {
        messages.push("Failed to clear PIN to prevent future auto-unlocks");
        // Continue silently as not a fatal error
      }

      set({
        pin: pin,
        pinMode: "LOCKED",
        geminiApiKeyDecrypted: undefined,
        ...otherState,
      });

      return ok({ messages, uiMessage: "Successfully transition to locked mode" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to transition to locked mode") });
    }
  };

  const transitionToUnlockedMode = (
    geminiApiKeyDecrypted: string,
    pinUsed: string,
    otherState?: Partial<PinStore>,
  ): ErrOr => {
    const messages: Messages = ["Begin transitioning to unlocked mode"];

    try {
      set({
        pin: pinUsed,
        pinMode: "UNLOCKED",
        geminiApiKeyDecrypted: geminiApiKeyDecrypted,
        ...otherState,
      });

      return ok({ messages, uiMessage: "Successfully transitioned to unlocked mode" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to transition to unlocked mode") });
    }
  };

  const transitionToSetUpMode = async (otherState?: Partial<PinStore>): Promise<ErrOr> => {
    const messages: Messages = ["Begin transitioning to setup mode"];

    try {
      const defaultByoKeyData = DEFAULT_BYO_KEY_DATA;
      const defaultTemporaryData = DEFAULT_TEMPORARY_DATA;

      const saveToSyncStorageResponse = await saveToSyncStorage(ByoKeyDataSchema, defaultByoKeyData);

      messages.push(saveToSyncStorageResponse.messages);

      if (!saveToSyncStorageResponse.isOk) {
        return err({
          messages,
          uiMessage: saveToSyncStorageResponse.uiMessage,
          isAddUiMessageToMessages: false,
        });
      }

      const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, defaultTemporaryData);

      messages.push(saveToSessionStorageResponse.messages);

      if (!saveToSessionStorageResponse.isOk) {
        return err({
          messages,
          uiMessage: saveToSessionStorageResponse.uiMessage,
          isAddUiMessageToMessages: false,
        });
      }

      set({
        pinMode: "SETTING_UP",
        geminiApiKeyDecrypted: undefined,
        ...defaultByoKeyData,
        ...defaultTemporaryData,
        ...otherState,
      });

      return ok({ messages, uiMessage: "Successfully transitioned to setup mode" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to transition to setup mode") });
    }
  };

  const encryptApiKey = async (
    pin: string,
    apiKey: string,
    shouldTestApiKey: boolean = false,
  ): Promise<ErrOr<ByoKeyData>> => {
    const messages: Messages = ["Begin encrypting and saving API key"];

    try {
      const cleanPin = pin.trim();
      const cleanApiKey = apiKey.trim();
      const cleanApiKeyHash = await hash(cleanApiKey);
      const encryptApiKeyResponse = await encryptData(cleanApiKey, cleanPin);

      messages.push(encryptApiKeyResponse.messages);

      if (!encryptApiKeyResponse.isOk) {
        return err({ messages, uiMessage: encryptApiKeyResponse.uiMessage, isAddUiMessageToMessages: false });
      }

      let isApiKeyValid = null;

      if (shouldTestApiKey) {
        const validateApiKeyResponse = await validateApiKey(cleanApiKey);
        messages.push(validateApiKeyResponse.messages);

        if (!validateApiKeyResponse.isOk) {
          return err({ messages, uiMessage: validateApiKeyResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        isApiKeyValid = validateApiKeyResponse.value;
      }

      const nextData: ByoKeyData = {
        geminiApiKeyEncrypted: encryptApiKeyResponse.value,
        geminiApiKeyHash: cleanApiKeyHash,
        hasGeminiApiKeyConnectedSuccessfully: isApiKeyValid,
      };

      const saveToSyncStorageResponse = await saveToSyncStorage(ByoKeyDataSchema, nextData);

      messages.push(saveToSyncStorageResponse.messages);

      if (!saveToSyncStorageResponse.isOk) {
        return err({ messages, uiMessage: saveToSyncStorageResponse.uiMessage, isAddUiMessageToMessages: false });
      }

      set({ geminiApiKeyDecrypted: cleanApiKey, ...nextData });

      return ok({ messages, uiMessage: "Successfully encrypted and saved API key", value: nextData });
    } catch (error) {
      return err({ messages, uiMessage: logError(error, "Failed to encrypt and save API key") });
    }
  };

  return {
    ...DEFAULT_BYO_KEY_DATA,
    ...DEFAULT_TEMPORARY_DATA,
    isInitialized: false,
    pinMode: "LOCKED",
    geminiApiKeyDecrypted: undefined,
    isGeminiApiKeyDirty: false,

    initialize: async (): Promise<ErrOr> => {
      const messages: Messages = ["Begin initializing PinStore"];

      try {
        set({ isInitialized: false });

        const loadByoKeyDataResponse = await loadByoKeyDataFromSyncStorage();

        messages.push(loadByoKeyDataResponse.messages);

        if (!loadByoKeyDataResponse.isOk) {
          return err({ messages, uiMessage: loadByoKeyDataResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const byoKeyData = loadByoKeyDataResponse.value;

        const loadTemporaryDataResponse = await loadTemporaryDataFromSessionStorage();

        messages.push(loadTemporaryDataResponse.messages);

        if (!loadTemporaryDataResponse.isOk) {
          return err({ messages, uiMessage: loadTemporaryDataResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const temporaryData = loadTemporaryDataResponse.value;

        const hasApiKeySaved = byoKeyData.geminiApiKeyEncrypted && byoKeyData.geminiApiKeyHash;

        set({
          isInitialized: true,
          pinMode: hasApiKeySaved ? "LOCKED" : "SETTING_UP",
          geminiApiKeyDecrypted: undefined,
          ...byoKeyData,
          ...temporaryData,
        });

        return ok({ messages, uiMessage: "Successfully initialized PinStore" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to initialize PinStore") });
      }
    },

    lock: async (): Promise<ErrOr> => {
      const messages: Messages = ["Begin locking"];

      try {
        if (get().pinMode !== "UNLOCKED") {
          return err({ messages, uiMessage: "Can only lock when unlocked" });
        }

        const transitionToLockedModeResponse = await transitionToLockedMode();

        messages.push(transitionToLockedModeResponse.messages);

        if (!transitionToLockedModeResponse.isOk) {
          return err({
            messages,
            uiMessage: transitionToLockedModeResponse.uiMessage,
            isAddUiMessageToMessages: false,
          });
        }

        return ok({ messages, uiMessage: "Successfully locked" });
      } catch (error) {
        return err({ messages, uiMessage: logError(error, "Failed to lock") });
      }
    },

    unlock: async (pin: string): Promise<ErrOr> => {
      const messages: Messages = ["Begin unlocking"];

      try {
        if (get().pinMode !== "LOCKED") {
          return err({ messages, uiMessage: "Can only unlock when locked" });
        }

        const cleanNewPin = pin.trim();
        const existingEncryptedKey = get().geminiApiKeyEncrypted;
        const existingKeyHash = get().geminiApiKeyHash;
        const hasNothingToUnlock = !existingEncryptedKey || !existingKeyHash;

        if (hasNothingToUnlock) {
          return err({ messages, uiMessage: "Nothing to unlock, please reset to start over" });
        }

        const decryptionResponse = await decryptData(existingEncryptedKey, cleanNewPin);

        messages.push(decryptionResponse.messages);

        if (!decryptionResponse.isOk) {
          return err({ messages, uiMessage: decryptionResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const currKeyHash = await hash(decryptionResponse.value);

        if (currKeyHash !== existingKeyHash) {
          return err({ messages, uiMessage: "PIN failed" });
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, {
          pin: cleanNewPin,
          prompt: get().prompt,
        });

        messages.push(saveToSessionStorageResponse.messages);

        if (!saveToSessionStorageResponse.isOk) {
          messages.push("Failed to save PIN for future auto-unlocks");
          // continue as not global
        }

        const transitionToUnlockedModeResponse = transitionToUnlockedMode(decryptionResponse.value, cleanNewPin);

        messages.push(transitionToUnlockedModeResponse.messages);

        if (!transitionToUnlockedModeResponse.isOk) {
          return err({
            messages,
            uiMessage: transitionToUnlockedModeResponse.uiMessage,
            isAddUiMessageToMessages: false,
          });
        }

        return ok({ messages, uiMessage: "Successfully unlocked" });
      } catch (error) {
        return err({ messages, uiMessage: logError(error, "Failed to unlock") });
      }
    },

    saveNewPin: async (newPin: string): Promise<ErrOr> => {
      const messages: Messages = ["Begin saving new PIN"];

      try {
        if (get().pinMode !== "SETTING_UP") {
          return err({ messages, uiMessage: "Can only save new PIN during setup" });
        }

        const cleanNewPin = newPin.trim();
        const apiKeyDecrypted = get().geminiApiKeyDecrypted ?? "";
        const encryptApiKeyResponse = await encryptApiKey(cleanNewPin, apiKeyDecrypted, false);

        messages.push(encryptApiKeyResponse.messages);

        if (!encryptApiKeyResponse.isOk) {
          return err({ messages, uiMessage: encryptApiKeyResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, {
          pin: cleanNewPin,
          prompt: get().prompt,
        });

        messages.push(saveToSessionStorageResponse.messages);

        if (!saveToSessionStorageResponse.isOk) {
          return err({ messages, uiMessage: saveToSessionStorageResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const transitionToUnlockedModeResponse = transitionToUnlockedMode(apiKeyDecrypted, cleanNewPin);

        messages.push(transitionToUnlockedModeResponse.messages);

        if (!transitionToUnlockedModeResponse.isOk) {
          return err({
            messages,
            uiMessage: transitionToUnlockedModeResponse.uiMessage,
            isAddUiMessageToMessages: false,
          });
        }

        return ok({ messages, uiMessage: "Successfully saved new PIN" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to save new PIN") });
      }
    },

    saveNewApiKey: async (newApiKey: string, shouldTest: boolean = false): Promise<ErrOr> => {
      const messages: Messages = ["Begin saving new API key"];

      try {
        const pin = get().pin;

        if (!pin) {
          return err({ messages, uiMessage: "Please save a PIN first" });
        }

        const encryptApiKeyResponse = await encryptApiKey(pin, newApiKey, shouldTest);

        messages.push(encryptApiKeyResponse.messages);

        if (!encryptApiKeyResponse.isOk) {
          return err({ messages, uiMessage: encryptApiKeyResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        return ok({ messages, uiMessage: "Successfully saved new API key" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to save new API key") });
      }
    },

    savePrompt: async (prompt: string): Promise<ErrOr> => {
      const messages: Messages = ["Begin saving prompt"];

      try {
        const cleanPrompt = prompt.trim();
        const nextData: TemporaryData = { prompt: cleanPrompt, pin: get().pin };
        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, nextData);

        messages.push(saveToSessionStorageResponse.messages);

        if (!saveToSessionStorageResponse.isOk) {
          return err({ messages, uiMessage: saveToSessionStorageResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        set({ ...nextData });

        return ok({ messages, uiMessage: "Successfully saved prompt" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to save prompt") });
      }
    },

    reset: async (): Promise<ErrOr> => {
      const messages: Messages = ["Begin resetting"];

      try {
        const transitionToSetUpModeResponse = await transitionToSetUpMode();

        messages.push(transitionToSetUpModeResponse.messages);

        if (!transitionToSetUpModeResponse.isOk) {
          return err({ messages, uiMessage: transitionToSetUpModeResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        return ok({ messages, uiMessage: "Successfully reset" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to reset") });
      }
    },

    setIsApiKeyDirty: (isDirty: boolean): ErrOr => {
      const messages: Messages = ["Begin setting isGeminiApiKeyDirty"];

      try {
        set({ isGeminiApiKeyDirty: isDirty });
        return ok({ messages, uiMessage: "Successfully set isGeminiApiKeyDirty" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to set isGeminiApiKeyDirty") });
      }
    },

    GET_DEBUG_DUMP: () => ({ ...get() }),
  };
});
