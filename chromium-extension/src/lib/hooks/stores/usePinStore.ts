import { create } from "zustand";
import { ByoKeyData, ByoKeyDataSchema, getDefaultByoKeyData } from "~/lib/models/ByoKeyData";
import { err, ErrOr, ok } from "~/lib/models/OneOf";
import { getDefaultTemporaryData, TemporaryData, TemporaryDataSchema } from "~/lib/models/TemporaryData";
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

//#region STORE DEFINITION
type PinStore = ByoKeyData &
  TemporaryData & {
    isInitialized: boolean;
    pinMode: PinMode;
    geminiApiKeyDecrypted?: string;
    isGeminiApiKeyDirty: boolean;
    fatalError?: string;

    /**
     * Sets the state w any previously saved data
     */
    initialize: () => Promise<ErrOr>;

    /**
     * When "UNLOCKED", attempts to transition to "LOCKED"
     */
    lock: () => Promise<ErrOr>;

    /**
     * When "LOCKED", attempts to transition to "UNLOCKED"
     * Success = PIN is able to decrypt the data
     * Upon success, the pin is saved in-memory and in temporary browser storage (for auto-unlock within the same browser session)
     */
    unlock: (pin: string) => Promise<ErrOr>;

    /**
     * When "SETTING_UP", users can set the PIN
     * Includes re-encryping the existing/dummy API key
     */
    setNewPin: (newPin: string) => Promise<ErrOr>;

    /**
     * When "UNLOCKED", users can set the API key
     * Includes hashing, encrypting, and testing the key
     */
    setNewApiKey: (newKey: string, shouldTest: boolean) => Promise<ErrOr>;

    /**
     * Reset all data to defaults and transition to "SETTING_UP"
     */
    reset: () => Promise<ErrOr>;

    /**
     * Signal to other UI that current API key input has not been saved yet
     */
    setIsApiKeyDirty: (isDirty: boolean) => ErrOr;

    /**
     * Signal to other UI that a fatal error has occurred
     */
    setFatalError: (error?: string) => ErrOr;

    /**
     * Get a JSON dump of this store, render in <pre> tags for fast debugging/insights
     */
    GET_DEBUG_JSON_DUMP: () => string;
  };
//#endregion

export const usePinStore = create<PinStore>((set, get) => {
  //#region PRIVATE
  const transitionToLockedMode = async (otherState?: Partial<PinStore>): Promise<ErrOr> => {
    let messages = ["Begin transitioning to locked mode"];

    try {
      // If the user intentionally locks, clear the PIN so nothing tries to auto-unlock
      const pin = null;
      const clearTempDataResponse = await saveToSessionStorage(TemporaryDataSchema, { pin });

      messages = messages.concat(clearTempDataResponse.messages);

      if (!clearTempDataResponse.isOk) {
        messages.push("Failed to clear PIN to prevent future auto-unlocks");
        // continue
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
    let messages = ["Begin transitioning to unlocked mode"];

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
    let messages = ["Begin transitioning to setup mode"];

    try {
      const defaultByoKeyData = getDefaultByoKeyData();
      const defaultTemporaryData = getDefaultTemporaryData();

      const saveToSyncStorageResponse = await saveToSyncStorage(ByoKeyDataSchema, defaultByoKeyData);

      messages = messages.concat(saveToSyncStorageResponse.messages);

      if (!saveToSyncStorageResponse.isOk) {
        return err({
          messages,
          uiMessage: saveToSyncStorageResponse.uiMessage,
          isAddUiMessageToMessages: false,
        });
      }

      const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, defaultTemporaryData);

      messages = messages.concat(saveToSessionStorageResponse.messages);

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
    let messages = ["Begin encrypting and saving API key"];

    try {
      const cleanPin = pin.trim();
      const cleanApiKey = apiKey.trim();
      const cleanApiKeyHash = await hash(cleanApiKey);
      const encryptApiKeyResponse = await encryptData(cleanApiKey, cleanPin);

      messages = messages.concat(encryptApiKeyResponse.messages);

      if (!encryptApiKeyResponse.isOk) {
        return err({ messages, uiMessage: encryptApiKeyResponse.uiMessage, isAddUiMessageToMessages: false });
      }

      let isApiKeyValid = null;

      if (shouldTestApiKey) {
        const validateApiKeyResponse = await validateApiKey(cleanApiKey);
        messages = messages.concat(validateApiKeyResponse.messages);

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

      messages = messages.concat(saveToSyncStorageResponse.messages);

      if (!saveToSyncStorageResponse.isOk) {
        return err({ messages, uiMessage: saveToSyncStorageResponse.uiMessage, isAddUiMessageToMessages: false });
      }

      set({ geminiApiKeyDecrypted: cleanApiKey, ...nextData });

      return ok({ messages, uiMessage: "Successfully encrypted and saved API key", value: nextData });
    } catch (error) {
      return err({ messages, uiMessage: logError(error, "Failed to encrypt and save API key") });
    }
  };

  //#endregion

  //#region PUBLIC
  return {
    ...getDefaultByoKeyData(),
    ...getDefaultTemporaryData(),
    isInitialized: false,
    pinMode: "LOCKED",
    geminiApiKeyDecrypted: undefined,
    isGeminiApiKeyDirty: false,
    fatalError: undefined,

    initialize: async (): Promise<ErrOr> => {
      let messages = ["Begin initializing PinStore"];

      try {
        set({ isInitialized: false });

        const loadByoKeyDataResponse = await loadByoKeyDataFromSyncStorage();

        messages = messages.concat(loadByoKeyDataResponse.messages);

        if (!loadByoKeyDataResponse.isOk) {
          return err({ messages, uiMessage: loadByoKeyDataResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const byoKeyData = loadByoKeyDataResponse.value;

        const loadTemporaryDataResponse = await loadTemporaryDataFromSessionStorage();

        messages = messages.concat(loadTemporaryDataResponse.messages);

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
      let messages = ["Begin locking"];

      try {
        if (get().pinMode !== "UNLOCKED") {
          return err({ messages, uiMessage: "Can only lock when unlocked" });
        }

        const transitionToLockedModeResponse = await transitionToLockedMode();

        messages = messages.concat(transitionToLockedModeResponse.messages);

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
      let messages = ["Begin unlocking"];

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

        messages = messages.concat(decryptionResponse.messages);

        if (!decryptionResponse.isOk) {
          return err({ messages, uiMessage: decryptionResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const currKeyHash = await hash(decryptionResponse.value);

        if (currKeyHash !== existingKeyHash) {
          return err({ messages, uiMessage: "PIN failed" });
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, { pin: cleanNewPin });

        messages = messages.concat(saveToSessionStorageResponse.messages);

        if (!saveToSessionStorageResponse.isOk) {
          messages.push("Failed to save PIN for future auto-unlocks");
          // continue as not fatal
        }

        const transitionToUnlockedModeResponse = transitionToUnlockedMode(decryptionResponse.value, cleanNewPin);

        messages = messages.concat(transitionToUnlockedModeResponse.messages);

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

    setNewPin: async (newPin: string): Promise<ErrOr> => {
      let messages = ["Begin setting new PIN"];

      try {
        if (get().pinMode !== "SETTING_UP") {
          return err({ messages, uiMessage: "Can only set new PIN during setup" });
        }

        const cleanNewPin = newPin.trim();
        const apiKeyDecrypted = get().geminiApiKeyDecrypted ?? "";
        const encryptApiKeyResponse = await encryptApiKey(cleanNewPin, apiKeyDecrypted, false);

        messages = messages.concat(encryptApiKeyResponse.messages);

        if (!encryptApiKeyResponse.isOk) {
          return err({ messages, uiMessage: encryptApiKeyResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, { pin: cleanNewPin });

        messages = messages.concat(saveToSessionStorageResponse.messages);

        if (!saveToSessionStorageResponse.isOk) {
          return err({ messages, uiMessage: saveToSessionStorageResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        const transitionToUnlockedModeResponse = transitionToUnlockedMode(apiKeyDecrypted, cleanNewPin);

        messages = messages.concat(transitionToUnlockedModeResponse.messages);

        if (!transitionToUnlockedModeResponse.isOk) {
          return err({
            messages,
            uiMessage: transitionToUnlockedModeResponse.uiMessage,
            isAddUiMessageToMessages: false,
          });
        }

        return ok({ messages, uiMessage: "Successfully set new PIN" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to set new PIN") });
      }
    },

    setNewApiKey: async (newApiKey: string, shouldTest: boolean = false): Promise<ErrOr> => {
      let messages = ["Begin setting new API key"];

      try {
        if (get().pinMode !== "UNLOCKED") {
          return err({ messages, uiMessage: "Can only set new API key when unlocked" });
        }

        const pin = get().pin;

        if (!pin) {
          return err({ messages, uiMessage: "Please set a PIN first" });
        }

        const encryptApiKeyResponse = await encryptApiKey(pin, newApiKey, shouldTest);

        messages = messages.concat(encryptApiKeyResponse.messages);

        if (!encryptApiKeyResponse.isOk) {
          return err({ messages, uiMessage: encryptApiKeyResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        return ok({ messages, uiMessage: "Successfully set new API key" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to set new API key") });
      }
    },

    reset: async (): Promise<ErrOr> => {
      let messages = ["Begin resetting"];

      try {
        const transitionToSetUpModeResponse = await transitionToSetUpMode();

        messages = messages.concat(transitionToSetUpModeResponse.messages);

        if (!transitionToSetUpModeResponse.isOk) {
          return err({ messages, uiMessage: transitionToSetUpModeResponse.uiMessage, isAddUiMessageToMessages: false });
        }

        return ok({ messages, uiMessage: "Successfully reset" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to reset") });
      }
    },

    setIsApiKeyDirty: (isDirty: boolean): ErrOr => {
      let messages = ["Begin setting isGeminiApiKeyDirty"];

      try {
        set({ isGeminiApiKeyDirty: isDirty });
        return ok({ messages, uiMessage: "Successfully set isGeminiApiKeyDirty" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to set isGeminiApiKeyDirty") });
      }
    },

    setFatalError: (error?: string): ErrOr => {
      let messages = ["Begin setting fatalError"];

      try {
        set({ fatalError: error });
        return ok({ messages, uiMessage: "Successfully set fatalError" });
      } catch (error: unknown) {
        return err({ messages, uiMessage: logError(error, "Failed to set fatalError") });
      }
    },

    GET_DEBUG_JSON_DUMP: () => JSON.stringify(get(), null, 2),
  };
  //#endregion
});
