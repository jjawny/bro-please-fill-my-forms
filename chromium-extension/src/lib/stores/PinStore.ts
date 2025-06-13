import { create } from "zustand";
import { ByoKeyData, ByoKeyDataSchema, getDefaultByoKeyData } from "../types/ByoKeyData";
import { OneOf } from "../types/OneOf";
import { getDefaultTemporaryData, TemporaryData, TemporaryDataSchema } from "../types/TemporaryData";
import { safelyLoadTemporaryDataFromSessionStorage, saveToSessionStorage } from "../utils/chrome-storage-session";
import { safelyLoadByoKeyDataFromSyncStorage, saveToSyncStorage } from "../utils/chrome-storage-sync";
import { decryptData, encryptData, hash } from "../utils/crypto";
import { validateApiKey } from "../utils/geminiApi";

type PinStatus = "SETTING_UP" | "LOCKED" | "UNLOCKED";
type PinStore = ByoKeyData &
  TemporaryData & {
    isInitialized: boolean;
    pinStatus: PinStatus;
    geminiApiKeyDecrypted?: string;
    isGeminiApiKeyDirty: boolean;

    /**
     * Sets the state w any previously saved data
     */
    initialize: () => Promise<void>;
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
    setIsApiKeyDirty: (isDirty: boolean) => void;
    /**
     * Get a JSON dump of this store, render in <pre> tags for fast debugging/insights
     */
    GET_DEBUG_JSON_DUMP: () => string;
  };

export const usePinStore = create<PinStore>((set, get) => {
  // TODO: bubble-up more OneOfs from all these transition functions
  const transitionToLockedStatus = async (otherState?: Partial<PinStore>) => {
    // If the user intentionally locks, clear the PIN so nothing tries to auto-unlock
    const pin = null;
    const clearTempDataResponse = await saveToSessionStorage(TemporaryDataSchema, { pin });
    console.debug("Clear temporary data response:", clearTempDataResponse);

    set({
      pin: pin,
      pinStatus: "LOCKED",
      geminiApiKeyDecrypted: undefined,
      ...otherState,
    });
  };
  const transitionToUnlockedStatus = (
    geminiApiKeyDecrypted: string,
    pinUsed: string,
    otherState?: Partial<PinStore>,
  ) => {
    set({
      pin: pinUsed,
      pinStatus: "UNLOCKED",
      geminiApiKeyDecrypted: geminiApiKeyDecrypted,
      ...otherState,
    });
  };
  const transitionToSettingUpStatus = async (otherState?: Partial<PinStore>) => {
    const defaultByoKeyData = getDefaultByoKeyData();
    const defaultTemporaryData = getDefaultTemporaryData();

    await saveToSyncStorage(ByoKeyDataSchema, defaultByoKeyData);
    await saveToSessionStorage(TemporaryDataSchema, defaultTemporaryData);

    set({
      pinStatus: "SETTING_UP",
      geminiApiKeyDecrypted: undefined,
      ...defaultByoKeyData,
      ...defaultTemporaryData,
      ...otherState,
    });
  };

  const encryptApiKey = async (
    pin: string,
    apiKey: string,
    shouldTestApiKey: boolean = false,
  ): Promise<OneOf<ByoKeyData, string>> => {
    let messages: string[] = [];

    try {
      const cleanPin = pin.trim();
      const cleanApiKey = apiKey.trim();
      const apiKeyHash = await hash(cleanApiKey);
      const encryptApiKeyResponse = await encryptData(cleanApiKey, cleanPin);

      messages = messages.concat(encryptApiKeyResponse.messages ?? []);

      if (!encryptApiKeyResponse.isOk) {
        return { isOk: false, error: encryptApiKeyResponse.error, messages };
      }

      let isApiKeyValid = false;

      if (shouldTestApiKey) {
        isApiKeyValid = await validateApiKey(cleanApiKey);
      }

      const nextData: ByoKeyData = {
        geminiApiKeyEncrypted: encryptApiKeyResponse.value,
        geminiApiKeyHash: apiKeyHash,
        hasGeminiApiKeyConnectedSuccessfully: isApiKeyValid ?? false,
      };

      const saveToSyncStorageResponse = await saveToSyncStorage(ByoKeyDataSchema, nextData);
      messages = messages.concat(saveToSyncStorageResponse.messages ?? []);

      set({ geminiApiKeyDecrypted: cleanApiKey, ...nextData });

      console.debug("Encrypted and saved API key successfully:", nextData);

      return { isOk: true, value: nextData, messages };
    } catch (error) {
      console.error(
        `Failed to encrypt and save API key, reason: ${error instanceof Error ? error.message : "Unknown"}`,
        error,
      );
      return { isOk: false, error: "Failed to encrypt and save API key", messages };
    }
  };

  return {
    ...getDefaultByoKeyData(),
    ...getDefaultTemporaryData(),
    isInitialized: false,
    pinStatus: "LOCKED",
    geminiApiKeyDecrypted: undefined,
    isGeminiApiKeyDirty: false,

    initialize: async () => {
      set({ isInitialized: false });

      const byoKeyData = await safelyLoadByoKeyDataFromSyncStorage();
      const temporaryData = await safelyLoadTemporaryDataFromSessionStorage();
      const hasApiKeySaved = byoKeyData.geminiApiKeyEncrypted && byoKeyData.geminiApiKeyHash;

      set({
        isInitialized: true,
        pinStatus: hasApiKeySaved ? "LOCKED" : "SETTING_UP",
        geminiApiKeyDecrypted: undefined,
        ...byoKeyData,
        ...temporaryData,
      });
    },

    lock: async (): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        if (get().pinStatus !== "UNLOCKED") {
          return { isOk: false, error: "Can only lock when unlocked" };
        }

        await transitionToLockedStatus();

        return { isOk: true, value: "Successfully locked", messages };
      } catch (error) {
        console.error(`Failed to lock, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to lock", messages };
      }
    },

    unlock: async (pin: string): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        if (get().pinStatus !== "LOCKED") {
          return { isOk: false, error: "Can only unlock when locked" };
        }

        const cleanNewPin = pin.trim();
        const existingEncryptedKey = get().geminiApiKeyEncrypted;
        const existingKeyHash = get().geminiApiKeyHash;
        const hasNothingToUnlock = !existingEncryptedKey || !existingKeyHash;

        if (hasNothingToUnlock) {
          await transitionToSettingUpStatus();
          return { isOk: false, error: "No data to unlock, please start over" };
        }

        const decryptionResponse = await decryptData(existingEncryptedKey, cleanNewPin);

        messages = messages.concat(decryptionResponse.messages ?? []);

        // Decryption can fail if the PIN was incorrect OR for other reasons
        // For simplicity and security, just respond w "PIN failed" for all of these cases
        if (!decryptionResponse.isOk || (await hash(decryptionResponse.value)) !== existingKeyHash) {
          return { isOk: false, error: "PIN failed" };
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, { pin: cleanNewPin });
        messages = messages.concat(saveToSessionStorageResponse.messages ?? []);

        transitionToUnlockedStatus(decryptionResponse.value, cleanNewPin);

        return { isOk: true, value: "Successfully unlocked", messages };
      } catch (error) {
        console.error(`Failed to unlock, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to unlock", messages };
      }
    },

    setNewPin: async (newPin: string): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        if (get().pinStatus !== "SETTING_UP") {
          return { isOk: false, error: "Can only set new PIN during setup" };
        }

        const cleanNewPin = newPin.trim();
        const apiKeyDecrypted = get().geminiApiKeyDecrypted ?? "";
        const encryptApiKeyResponse = await encryptApiKey(cleanNewPin, apiKeyDecrypted, false);

        messages = messages.concat(encryptApiKeyResponse.messages ?? []);

        if (!encryptApiKeyResponse.isOk) {
          return { isOk: false, error: encryptApiKeyResponse.error, messages };
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, { pin: cleanNewPin });
        messages = messages.concat(saveToSessionStorageResponse.messages ?? []);

        transitionToUnlockedStatus(apiKeyDecrypted, cleanNewPin);

        return { isOk: true, value: "Successfully set new PIN", messages };
      } catch (error) {
        console.error(`Failed to set new PIN, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to set new PIN", messages };
      }
    },

    setNewApiKey: async (newApiKey: string, shouldTest: boolean = false): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        if (get().pinStatus !== "UNLOCKED") {
          return { isOk: false, error: "Can only set new API key when unlocked" };
        }

        const pin = get().pin;

        if (!pin) {
          return { isOk: false, error: "Please set a PIN first" };
        }

        const encryptApiKeyResponse = await encryptApiKey(pin, newApiKey, shouldTest);

        messages = messages.concat(encryptApiKeyResponse.messages ?? []);

        if (!encryptApiKeyResponse.isOk) {
          return { isOk: false, error: encryptApiKeyResponse.error, messages };
        }

        return { isOk: true, value: "Successfully set new API key", messages };
      } catch (error) {
        console.error(
          `Failed to set new API key, reason: ${error instanceof Error ? error.message : "Unknown"}`,
          error,
        );
        return { isOk: false, error: "Failed to set new API key", messages };
      }
    },

    reset: async (): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        await transitionToSettingUpStatus();

        return { isOk: true, value: "Successfully reset", messages };
      } catch (error) {
        console.error(`Failed to reset, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to reset", messages };
      }
    },

    setIsApiKeyDirty: (isDirty: boolean) => set({ isGeminiApiKeyDirty: isDirty }),

    GET_DEBUG_JSON_DUMP: () => JSON.stringify(get(), null, 2),
  };
});
