import { create } from "zustand";
import { ByoKeyData, ByoKeyDataSchema, getDefaultByoKeyData } from "../types/ByoKeyData";
import { OneOf } from "../types/OneOf";
import { getDefaultTemporaryData, TemporaryData, TemporaryDataSchema } from "../types/TemporaryData";
import { safelyLoadTemporaryDataFromSessionStorage, saveToSessionStorage } from "../utils/chrome-storage-session";
import { safelyLoadByoKeyDataFromSyncStorage, saveToSyncStorage } from "../utils/chrome-storage-sync";
import { decryptData, encryptData, hash } from "../utils/crypto";

type PinStatus = "SETTING_UP" | "LOCKED" | "UNLOCKED";
type PinStore = ByoKeyData &
  TemporaryData & {
    isInitialized: boolean;
    pinStatus: PinStatus;
    geminiApiKeyDecrypted?: string;
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
    useNewApiKey: (newKey: string) => Promise<OneOf<string, string>>;
    /**
     * Reset all data to defaults and transition to "SETTING_UP"
     */
    reset: () => Promise<OneOf<string, string>>;
    /**
     * Get a JSON dump of this store, render in <pre> tags for fast debugging/insights
     */
    GET_DEBUG_JSON_DUMP: () => string;
  };

export const usePinStore = create<PinStore>((set, get) => {
  const transitionToLockedStatus = (otherState?: Partial<PinStore>) => {
    set({
      pinStatus: "LOCKED",
      geminiApiKeyDecrypted: undefined,
      ...otherState,
    });
  };
  const transitionToUnlockedStatus = (geminiApiKeyDecrypted: string, pinUsed: string, otherState?: Partial<PinStore>) => {
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

  const encryptApiKey = async (pin: string, apiKey: string, shouldTestApiKey: boolean = false): Promise<OneOf<ByoKeyData, string>> => {
    let messages: string[] = [];

    try {
      const pinFormatted = pin.trim();
      const apiKeyFormatted = apiKey.trim();
      const apiKeyHash = await hash(apiKeyFormatted);
      const apiKeyEncrypted = await encryptData(apiKeyFormatted, pinFormatted);
      const isApiKeyValid = shouldTestApiKey ? true : get().hasGeminiApiKeyConnectedSuccessfully; // TODO: make API call to validate the key
      const nextData: ByoKeyData = {
        geminiApiKeyEncrypted: apiKeyEncrypted,
        geminiApiKeyHash: apiKeyHash,
        hasGeminiApiKeyConnectedSuccessfully: isApiKeyValid ?? false,
      };

      const saveToSyncStorageResponse = await saveToSyncStorage(ByoKeyDataSchema, nextData);
      messages = messages.concat(saveToSyncStorageResponse.messages ?? []);

      set({ geminiApiKeyDecrypted: apiKeyFormatted, ...nextData });

      return { isOk: true, value: nextData, messages };
    } catch (error) {
      console.error(`Failed to encrypt and save API key, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
      return { isOk: false, error: "Failed to encrypt and save API key", messages };
    }
  };

  return {
    ...getDefaultByoKeyData(),
    ...getDefaultTemporaryData(),
    isInitialized: false,
    pinStatus: "LOCKED",
    geminiApiKeyDecrypted: undefined,

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

        transitionToLockedStatus();

        return { isOk: true, value: "Successfully locked", messages: messages };
      } catch (error) {
        console.error(`Failed to lock, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to lock", messages: messages };
      }
    },

    unlock: async (pin: string): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        if (get().pinStatus !== "LOCKED") {
          return { isOk: false, error: "Can only unlock when locked" };
        }

        const newPinFormatted = pin.trim();
        const existingEncryptedKey = get().geminiApiKeyEncrypted;
        const existingKeyHash = get().geminiApiKeyHash;
        const hasNothingToUnlock = !existingEncryptedKey || !existingKeyHash;

        if (hasNothingToUnlock) {
          await transitionToSettingUpStatus();
          return { isOk: false, error: "No data to unlock, please start over" };
        }

        const decryptionResponse = await decryptData(existingEncryptedKey, newPinFormatted);

        if (!decryptionResponse.isOk) {
          return { isOk: false, error: decryptionResponse.error };
        }

        const decryptedKey = decryptionResponse.value;
        const decryptedKeyHash = await hash(decryptedKey);

        if (decryptedKeyHash !== existingKeyHash) {
          return { isOk: false, error: "Incorrect PIN" };
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, { pin: newPinFormatted });
        messages = messages.concat(saveToSessionStorageResponse.messages ?? []);

        transitionToUnlockedStatus(decryptedKey, newPinFormatted);

        return { isOk: true, value: "Successfully unlocked", messages: messages };
      } catch (error) {
        console.error(`Failed to unlock, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to unlock", messages: messages };
      }
    },

    setNewPin: async (newPin: string): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        if (get().pinStatus !== "SETTING_UP") {
          return { isOk: false, error: "Can only set new PIN during setup" };
        }

        const newPinFormatted = newPin.trim();
        const apiKeyDecrypted = get().geminiApiKeyDecrypted ?? "";
        const encryptApiKeyResponse = await encryptApiKey(newPinFormatted, apiKeyDecrypted, false);

        messages = messages.concat(encryptApiKeyResponse.messages ?? []);

        if (!encryptApiKeyResponse.isOk) {
          return { isOk: false, error: encryptApiKeyResponse.error, messages: messages };
        }

        const saveToSessionStorageResponse = await saveToSessionStorage(TemporaryDataSchema, { pin: newPinFormatted });
        messages = messages.concat(saveToSessionStorageResponse.messages ?? []);

        transitionToUnlockedStatus(apiKeyDecrypted, newPinFormatted);

        return { isOk: true, value: "Successfully set new PIN", messages: messages };
      } catch (error) {
        console.error(`Failed to set new PIN, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to set new PIN", messages: messages };
      }
    },

    useNewApiKey: async (newApiKey: string): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        if (get().pinStatus !== "UNLOCKED") {
          return { isOk: false, error: "Can only set new API key when unlocked" };
        }

        const pin = get().pin;

        if (!pin) {
          return { isOk: false, error: "Please set a PIN first" };
        }

        const encryptApiKeyResponse = await encryptApiKey(pin, newApiKey, true);

        messages = messages.concat(encryptApiKeyResponse.messages ?? []);

        if (!encryptApiKeyResponse.isOk) {
          return { isOk: false, error: encryptApiKeyResponse.error, messages: messages };
        }

        return { isOk: true, value: "Successfully set new API key", messages: messages };
      } catch (error) {
        console.error(`Failed to set new API key, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to set new API key", messages: messages };
      }
    },

    reset: async (): Promise<OneOf<string, string>> => {
      let messages: string[] = [];

      try {
        await transitionToSettingUpStatus();

        return { isOk: true, value: "Successfully reset", messages: messages };
      } catch (error) {
        console.error(`Failed to reset, reason: ${error instanceof Error ? error.message : "Unknown"}`, error);
        return { isOk: false, error: "Failed to reset", messages: messages };
      }
    },

    GET_DEBUG_JSON_DUMP: () => JSON.stringify(get(), null, 2),
  };
});
