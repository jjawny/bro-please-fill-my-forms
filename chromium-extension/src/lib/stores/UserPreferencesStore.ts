import { create } from "zustand";
import {
  defaultUserPreferences,
  UserPreferences,
} from "../types/UserPreferences";

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

type UserPreferencesStoreType = {
  userPreferences: UserPreferences;
  setUserPreferences: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
};

/**
 * Loads the initial data - previously saved user preferences
 * FYI: Zustand store becomes a singleton after being initialized (when first component accesses the store)
 * @returns previously saved user preferences
 */
const loadInitialData = async (): Promise<UserPreferences> => {
  // Attempt to load saved from Chrome storage
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    if (result[STORAGE_KEY]) {
      const saved = result[STORAGE_KEY] as UserPreferences;
      // Decrypt sensitive data
      const decryptedPreferences = {
        ...saved,
        geminiApiKey: saved.geminiApiKey
          ? decryptSensitiveData(saved.geminiApiKey)
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
  const defaults = defaultUserPreferences;
  await chrome.storage.local.set({ [STORAGE_KEY]: defaults });
  return defaults;
};

// Helper to save preferences to Chrome storage with encryption for sensitive data
const savePreferences = async (preferences: UserPreferences) => {
  try {
    const encryptedPreferences = {
      ...preferences,
      // Encrypt sensitive data like API keys
      geminiApiKey: preferences.geminiApiKey
        ? encryptSensitiveData(preferences.geminiApiKey)
        : "",
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: encryptedPreferences });
  } catch (err) {
    console.warn("Error saving preferences:", err);
  }
};

export const useUserPreferencesStore = create<UserPreferencesStoreType>(
  (set, get) => ({
    userPreferences: defaultUserPreferences,
    setUserPreferences: async (key, value) => {
      const nextData = { ...get().userPreferences, [key]: value };

      // Save to Chrome storage with encryption
      await savePreferences(nextData);

      set((state) => ({ ...state, userPreferences: nextData }));
    },
  })
);

// Initialize the store with saved data
loadInitialData().then((savedPreferences) => {
  useUserPreferencesStore.setState({ userPreferences: savedPreferences });
});
