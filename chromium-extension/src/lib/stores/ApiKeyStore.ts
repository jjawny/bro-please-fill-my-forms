import { create } from "zustand";
import { OneOf } from "../types/OneOf";
import {
  getDefaultTemporaryUserData,
  TemporaryUserData,
} from "../types/TemporaryData";
import { getDefaultUserData, UserData } from "../types/UserData";
import { loadFromSessionStorage } from "../utils/chrome-storage-session";
import { safelyLoadUserDataFromSyncStorage } from "../utils/chrome-storage-sync";
import { decryptData, hash } from "../utils/crypto";

type PinStatus = "LOCKED" | "UNLOCKED" | "SETTING_UP" | "RESETTING";
type ApiKeyStatus = "CONNECTION_SUCCESSFUL" | "DECRYPTED" | "NOT_READY";

type UserDataStore = UserData &
  TemporaryUserData & {
    geminiApiKeyDecrypted?: string; // in-memory only
    isLoading: boolean;
    pinStatus: PinStatus;
    apiKeyStatus: ApiKeyStatus;
    initialize: () => Promise<void>;
    unlock: (pin: string) => Promise<OneOf<string, string>>;
    // saveGeminiApiKey: (pin: string, newGeminiApiKey: string) => Promise<void>;
    // setPin: (newPin: string) => Promise<void>;
    // resetPin: () => Promise<OneOf<string, string>>;
    DEBUG_DUMP: () => Promise<void>;
  };

/**
 * There are 2 main user paths:
 *  1. No key > user sees API key field first > PIN field to encrypt
 */
export const useApiKeyStore = create<UserDataStore>((set, get) => ({
  ...getDefaultUserData(),
  ...getDefaultTemporaryUserData(),
  geminiApiKeyDecrypted: undefined,
  isLoading: false,
  pinStatus: "LOCKED",
  apiKeyStatus: "NOT_READY",

  /**
   * Sets the state w any previously saved data
   * Call upon rendering PIN UI for the first time
   */
  initialize: async () => {
    set({ isLoading: true });

    const userData = await safelyLoadUserDataFromSyncStorage();
    const temporaryUserData = await loadFromSessionStorage();

    set({
      isLoading: false,
      ...temporaryUserData,
      ...userData,
    });
  },

  /**
   * Attempt to transition to the unlocked state
   * Because we don't store the PIN, unlocked = successfully decrypted
   * @param pin
   */
  unlock: async (pin: string): Promise<OneOf<string, string>> => {
    const key = get().geminiApiKeyEncrypted;
    const keyHash = get().geminiApiKeyHash;

    if (!key || !keyHash) {
      set({
        geminiApiKeyDecrypted: undefined,
        pinStatus: "LOCKED",
        apiKeyStatus: "NOT_READY",
      });

      return {
        isOk: false,
        error: "No API key found. Please setup a new key.",
      };
    }

    var decryptedKey = await decryptData(key, pin); // TODO: convert to oneof (other ppl's functions we can wrap)
    var currentHash = await hash(decryptedKey);

    if (currentHash !== keyHash) {
      set({
        geminiApiKeyDecrypted: undefined,
        pinStatus: "LOCKED",
        apiKeyStatus: "NOT_READY",
      });

      return {
        isOk: false,
        error: "Invalid PIN or corrupted data",
      };
    }

    set({
      geminiApiKeyDecrypted: decryptedKey,
      pinStatus: "UNLOCKED",
      apiKeyStatus: "DECRYPTED",
    });

    return { isOk: true, value: decryptedKey };
  },

  DEBUG_DUMP: async () => {
    const userData: UserData = {
      theme: get().theme,
      geminiApiKeyEncrypted: get().geminiApiKeyEncrypted,
      geminiApiKeyHash: get().geminiApiKeyHash,
    };
    const temporaryUserData: TemporaryUserData = {
      pin: get().pin,
    };
    console.debug("[DEBUG] UserData:", userData);
    console.debug("[DEBUG] TemporaryUserData:", temporaryUserData);
  },
}));
