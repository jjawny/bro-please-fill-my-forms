import { create } from "zustand";
import { getDefaultUserData, UserData } from "../types/UserData";

export const STORAGE_KEY = "DIGI_WORLDS";

// Simple encryption for sensitive data like API keys
const encryptSensitiveData = (data: string): string => {
  // Basic base64 encoding for obfuscation (upgrade to crypto-js for production)
  return btoa(data);
};

const decryptSensitiveData = (encryptedData: string): string => {
  try {
    return atob(encryptedData);
  } catch {
    return "";
  }
};

type UserDataStoreType = {
  UserData: UserData;
  setUserData: <K extends keyof UserData>(key: K, value: UserData[K]) => void;
};

/**
 * Loads the initial data - previously saved user preferences
 * FYI: Zustand store becomes a singleton after being initialized (when first component accesses the store)
 * @returns previously saved user preferences
 */
const loadInitialData = async (): Promise<UserData> => {
  // Attempt to load saved from Chrome storage
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    if (result[STORAGE_KEY]) {
      const saved = result[STORAGE_KEY] as UserData;
      // Decrypt sensitive data
      const decryptedPreferences = {
        ...saved,
        geminiApiKey: saved.geminiApiKeyEncrypted
          ? decryptSensitiveData(saved.geminiApiKeyEncrypted)
          : "",
      };
      console.log("Your previously saved preferences:", {
        ...decryptedPreferences,
        geminiApiKey: "***",
      });
      return decryptedPreferences;
    }
  } catch (err) {
    console.warn("Error loading your previously saved preferences:", err);
  }

  // Load defaults
  const defaults = getDefaultUserData();
  await chrome.storage.local.set({ [STORAGE_KEY]: defaults });
  return defaults;
};

// Helper to save preferences to Chrome storage with encryption for sensitive data
const savePreferences = async (preferences: UserData) => {
  try {
    const encryptedPreferences = {
      ...preferences,
      // Encrypt sensitive data like API keys
      geminiApiKey: preferences.geminiApiKeyEncrypted
        ? encryptSensitiveData(preferences.geminiApiKeyEncrypted)
        : "",
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: encryptedPreferences });
  } catch (err) {
    console.warn("Error saving preferences:", err);
  }
};

export const useUserDataStore = create<UserDataStoreType>((set, get) => ({
  UserData: getDefaultUserData(),
  setUserData: async (key, value) => {
    const nextData = { ...get().UserData, [key]: value };

    // Save to Chrome storage with encryption
    await savePreferences(nextData);

    set((state) => ({ ...state, UserData: nextData }));
  },
}));

// Initialize the store with saved data
loadInitialData().then((savedPreferences) => {
  useUserDataStore.setState({ UserData: savedPreferences });
});
