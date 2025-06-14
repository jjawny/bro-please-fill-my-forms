import { create } from "zustand";
import { ByoKeyData, ByoKeyDataSchema, getDefaultByoKeyData } from "~/lib/types/ByoKeyData";
import { OneOf } from "~/lib/types/OneOf";
import { getDefaultTemporaryData, TemporaryData, TemporaryDataSchema } from "~/lib/types/TemporaryData";
import { loadTemporaryDataFromSessionStorage, saveToSessionStorage } from "~/lib/utils/chrome-storage-session";
import { loadByoKeyDataFromSyncStorage, saveToSyncStorage } from "~/lib/utils/chrome-storage-sync";
import { logError } from "~/lib/utils/console-helpers";
import { decryptData, encryptData, hash } from "~/lib/utils/crypto";
import { validateApiKey } from "~/lib/utils/geminiApi";

type PinMode = "SETTING_UP" | "LOCKED" | "UNLOCKED";

//#region STORE DEFINITION
type PinStore = ByoKeyData &
  TemporaryData & {
    isInitialized: boolean;
    pinMode: PinMode;
    geminiApiKeyDecrypted?: string;
    isGeminiApiKeyDirty: boolean;

    /**
     * Sets the state w any previously saved data
     */
    initialize: () => Promise<OneOf<string, string>>;

    /**
     * When "UNLOCKED", attempts to transition to "LOCKED"
     */
    lock: () => Promise<OneOf<string, string>>;

    /**
     * When "LOCKED", attempts to transition to "UNLOCKED"
     * Success = PIN is able to decrypt the data
     * Upon success, the pin is saved in-memory and in temporary browser storage (for auto-unlock within the same browser session)
     */
    unlock: (pin: string) => Promise<OneOf<string, string>>;

    /**
     * When "SETTING_UP", users can set the PIN
     * Includes re-encryping the existing/dummy API key
     */
    setNewPin: (newPin: string) => Promise<OneOf<string, string>>;

    /**
     * When "UNLOCKED", users can set the API key
     * Includes hashing, encrypting, and testing the key
     */
    setNewApiKey: (newKey: string, shouldTest: boolean) => Promise<OneOf<string, string>>;

    /**
     * Reset all data to defaults and transition to "SETTING_UP"
     */
    reset: () => Promise<OneOf<string, string>>;

    /**
     * Signal to other UI that current API key input has not been saved yet
     */
    setIsApiKeyDirty: (isDirty: boolean) => OneOf<string, string>;

    /**
     * Get a JSON dump of this store, render in <pre> tags for fast debugging/insights
     */
    GET_DEBUG_JSON_DUMP: () => string;
  };
//#endregion

export const usePinStore = create<PinStore>((set, get) => {
  //#region PRIVATE
  const transitionToLockedMode = async (otherState?: Partial<PinStore>): Promise<OneOf<string, string>> => {
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

      const successMessage = "Successfully transition to locked mode";
      messages.push(successMessage);
      return { isOk: true, value: successMessage, messages };
    } catch (error: unknown) {
      const errorMessage = logError(error, "Failed to transition to locked mode");
      messages.push(errorMessage);
      return { isOk: false, error: errorMessage, messages };
    }
  };

  const transitionToUnlockedMode = (
    geminiApiKeyDecrypted: string,
    pinUsed: string,
    otherState?: Partial<PinStore>,
  ): OneOf<string, string> => {
    let messages = ["Begin transitioning to unlocked mode"];

    try {
      set({
        pin: pinUsed,
        pinMode: "UNLOCKED",
        geminiApiKeyDecrypted: geminiApiKeyDecrypted,
        ...otherState,
      });

      const successMessage = "Successfully transitioned to unlocked mode";
      messages.push(successMessage);
      return { isOk: true, value: successMessage, messages };
    } catch (error: unknown) {
      const errorMessage = logError(error, "Failed to transition to unlocked mode");
      messages.push(errorMessage);
      return { isOk: false, error: errorMessage, messages };
    }
  };

  const transitionToSetUpMode = async (otherState?: Partial<PinStore>): Promise<OneOf<string, string>> => {
    let messages = ["Begin transitioning to setup mode"];

    try {
      const defaultByoKeyData = getDefaultByoKeyData();
      const defaultTemporaryData = getDefaultTemporaryData();

      const saveToSyncStorageResponse = await saveToSyncStorage(ByoKeyDataSchema, defaultByoKeyData);

      messages = messages.concat(saveToSyncStorageResponse.messages);

      if (!saveToSyncStorageResponse.isOk) {
        const failMessage = "Failed to transition to setup mode";
        messages.push(failMessage);
        return { isOk: false, error: failMessage, messages };
      }

      const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, defaultTemporaryData);

      messages = messages.concat(saveToSessionStorageResponse.messages);

      if (!saveToSessionStorageResponse.isOk) {
        const failMessage = "Failed to transition to setup mode";
        messages.push(failMessage);
        return { isOk: false, error: failMessage, messages };
      }

      set({
        pinMode: "SETTING_UP",
        geminiApiKeyDecrypted: undefined,
        ...defaultByoKeyData,
        ...defaultTemporaryData,
        ...otherState,
      });

      const successMessage = "Successfully transitioned to setup mode";
      messages.push(successMessage);
      return { isOk: true, value: successMessage, messages };
    } catch (error: unknown) {
      const errorMessage = logError(error, "Failed to transition to setup mode");
      messages.push(errorMessage);
      return { isOk: false, error: errorMessage, messages };
    }
  };

  const encryptApiKey = async (
    pin: string,
    apiKey: string,
    shouldTestApiKey: boolean = false,
  ): Promise<OneOf<ByoKeyData, string>> => {
    let messages = ["Begin encrypting and saving API key"];

    try {
      const cleanPin = pin.trim();
      const cleanApiKey = apiKey.trim();
      const cleanApiKeyHash = await hash(cleanApiKey);
      const encryptApiKeyResponse = await encryptData(cleanApiKey, cleanPin);

      messages = messages.concat(encryptApiKeyResponse.messages);

      if (!encryptApiKeyResponse.isOk) {
        return { isOk: false, error: encryptApiKeyResponse.error, messages };
      }

      let isApiKeyValid = null;

      if (shouldTestApiKey) {
        const validateApiKeyResponse = await validateApiKey(cleanApiKey);
        messages = messages.concat(validateApiKeyResponse.messages);

        if (!validateApiKeyResponse.isOk) {
          const failMessage = "Failed to validate API key";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
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
        const failMessage = "Failed to save encrypted API key";
        messages.push(failMessage);
        return { isOk: false, error: failMessage, messages };
      }

      set({ geminiApiKeyDecrypted: cleanApiKey, ...nextData });

      const successMessage = "Successfully encrypted and saved API key";
      messages.push(successMessage);
      return { isOk: true, value: nextData, messages };
    } catch (error) {
      const errorMessage = logError(error, "Failed to encrypt and save API key");
      messages.push(errorMessage);
      return { isOk: false, error: errorMessage, messages };
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

    initialize: async (): Promise<OneOf<string, string>> => {
      let messages = ["Begin initializing PinStore"];

      try {
        set({ isInitialized: false });

        const loadByoKeyDataResponse = await loadByoKeyDataFromSyncStorage();

        messages = messages.concat(loadByoKeyDataResponse.messages);

        // Fallback to defaults
        let byoKeyData = getDefaultByoKeyData();

        if (loadByoKeyDataResponse.isOk) {
          byoKeyData = loadByoKeyDataResponse.value;
        }

        const loadTemporaryDataResponse = await loadTemporaryDataFromSessionStorage();

        messages = messages.concat(loadTemporaryDataResponse.messages);

        // Fallback to defaults
        let temporaryData = getDefaultTemporaryData();

        if (loadTemporaryDataResponse.isOk) {
          temporaryData = loadTemporaryDataResponse.value;
        }

        const hasApiKeySaved = byoKeyData.geminiApiKeyEncrypted && byoKeyData.geminiApiKeyHash;

        set({
          isInitialized: true,
          pinMode: hasApiKeySaved ? "LOCKED" : "SETTING_UP",
          geminiApiKeyDecrypted: undefined,
          ...byoKeyData,
          ...temporaryData,
        });

        const successMessage = "Successfully initialized PinStore";
        messages.push(successMessage);
        return { isOk: true, value: successMessage, messages };
      } catch (error: unknown) {
        const errorMessage = logError(error, "Failed to initialize PinStore");
        messages.push(errorMessage);
        return { isOk: false, error: errorMessage, messages };
      }
    },

    lock: async (): Promise<OneOf<string, string>> => {
      let messages = ["Begin locking"];

      try {
        if (get().pinMode !== "UNLOCKED") {
          const failMessage = "Can only unlock when locked";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const transitionToLockedModeResponse = await transitionToLockedMode();

        messages = messages.concat(transitionToLockedModeResponse.messages);

        if (!transitionToLockedModeResponse.isOk) {
          const failMessage = "Failed to lock";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const successMessage = "Successfully locked";
        messages.push(successMessage);
        return { isOk: true, value: successMessage, messages };
      } catch (error) {
        const errorMessage = logError(error, "Failed to lock");
        messages.push(errorMessage);
        return { isOk: false, error: errorMessage, messages };
      }
    },

    unlock: async (pin: string): Promise<OneOf<string, string>> => {
      let messages = ["Begin unlocking"];

      try {
        if (get().pinMode !== "LOCKED") {
          const failMessage = "Can only unlock when locked";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const cleanNewPin = pin.trim();
        const existingEncryptedKey = get().geminiApiKeyEncrypted;
        const existingKeyHash = get().geminiApiKeyHash;
        const hasNothingToUnlock = !existingEncryptedKey || !existingKeyHash;

        if (hasNothingToUnlock) {
          const failMessage = "Nothing to unlock, please reset to start over";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const decryptionResponse = await decryptData(existingEncryptedKey, cleanNewPin);

        messages = messages.concat(decryptionResponse.messages);

        // Decryption can fail if the PIN was incorrect OR for other reasons
        // For simplicity and security, just respond w "PIN failed" for all of these cases
        if (!decryptionResponse.isOk || (await hash(decryptionResponse.value)) !== existingKeyHash) {
          const failMessage = "PIN failed";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, { pin: cleanNewPin });

        messages = messages.concat(saveToSessionStorageResponse.messages);

        if (!saveToSessionStorageResponse.isOk) {
          messages.push("Failed to save PIN for future auto-unlocks");
          // continue
        }

        const transitionToUnlockedModeResponse = transitionToUnlockedMode(decryptionResponse.value, cleanNewPin);

        messages = messages.concat(transitionToUnlockedModeResponse.messages);

        if (!transitionToUnlockedModeResponse.isOk) {
          const failMessage = "Failed to unlock";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const successMessage = "Successfully unlocked";
        messages.push(successMessage);
        return { isOk: true, value: successMessage, messages };
      } catch (error) {
        const errorMessage = logError(error, "Failed to unlock");
        messages.push(errorMessage);
        return { isOk: false, error: errorMessage, messages };
      }
    },

    setNewPin: async (newPin: string): Promise<OneOf<string, string>> => {
      let messages = ["Begin setting new PIN"];

      try {
        if (get().pinMode !== "SETTING_UP") {
          const failMessage = "Can only set new PIN during setup";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const cleanNewPin = newPin.trim();
        const apiKeyDecrypted = get().geminiApiKeyDecrypted ?? "";
        const encryptApiKeyResponse = await encryptApiKey(cleanNewPin, apiKeyDecrypted, false);

        messages = messages.concat(encryptApiKeyResponse.messages);

        if (!encryptApiKeyResponse.isOk) {
          return { isOk: false, error: encryptApiKeyResponse.error, messages };
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, { pin: cleanNewPin });

        messages = messages.concat(saveToSessionStorageResponse.messages);

        if (!saveToSessionStorageResponse.isOk) {
          const failMessage = "Failed to save new PIN";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const transitionToUnlockedModeResponse = transitionToUnlockedMode(apiKeyDecrypted, cleanNewPin);

        messages = messages.concat(transitionToUnlockedModeResponse.messages);

        if (!transitionToUnlockedModeResponse.isOk) {
          const failMessage = "Failed to save new PIN";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const successMessage = "Successfully set new PIN";
        messages.push(successMessage);
        return { isOk: true, value: successMessage, messages };
      } catch (error: unknown) {
        const errorMessage = logError(error, "Failed to set new PIN");
        messages.push(errorMessage);
        return { isOk: false, error: errorMessage, messages };
      }
    },

    setNewApiKey: async (newApiKey: string, shouldTest: boolean = false): Promise<OneOf<string, string>> => {
      let messages = ["Begin setting new API key"];

      try {
        if (get().pinMode !== "UNLOCKED") {
          const failMessage = "Can only set new API key when unlocked";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const pin = get().pin;

        if (!pin) {
          const failMessage = "Please set a PIN first";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const encryptApiKeyResponse = await encryptApiKey(pin, newApiKey, shouldTest);

        messages = messages.concat(encryptApiKeyResponse.messages);

        if (!encryptApiKeyResponse.isOk) {
          return { isOk: false, error: encryptApiKeyResponse.error, messages };
        }

        const successMessage = "Successfully set new API key";
        messages.push(successMessage);
        return { isOk: true, value: successMessage, messages };
      } catch (error: unknown) {
        const errorMessage = logError(error, "Failed to set new API key");
        messages.push(errorMessage);
        return { isOk: false, error: errorMessage, messages };
      }
    },

    reset: async (): Promise<OneOf<string, string>> => {
      let messages = ["Begin resetting"];

      try {
        const transitionToSetUpModeResponse = await transitionToSetUpMode();

        messages = messages.concat(transitionToSetUpModeResponse.messages);

        if (!transitionToSetUpModeResponse.isOk) {
          const failMessage = "Failed to reset";
          messages.push(failMessage);
          return { isOk: false, error: failMessage, messages };
        }

        const successMessage = "Successfully reset";
        messages.push(successMessage);
        return { isOk: true, value: successMessage, messages };
      } catch (error: unknown) {
        const errorMessage = logError(error, "Failed to reset");
        messages.push(errorMessage);
        return { isOk: false, error: errorMessage, messages };
      }
    },

    setIsApiKeyDirty: (isDirty: boolean): OneOf<string, string> => {
      let messages = ["Begin setting isGeminiApiKeyDirty"];

      try {
        set({ isGeminiApiKeyDirty: isDirty });
        const successMessage = "Successfully set isGeminiApiKeyDirty";
        messages.push(successMessage);
        return { isOk: true, value: successMessage, messages };
      } catch (error: unknown) {
        const errorMessage = logError(error, "Failed to set isGeminiApiKeyDirty");
        messages.push(errorMessage);
        return { isOk: false, error: errorMessage, messages };
      }
    },

    GET_DEBUG_JSON_DUMP: () => JSON.stringify(get(), null, 2),
  };
  //#endregion
});
