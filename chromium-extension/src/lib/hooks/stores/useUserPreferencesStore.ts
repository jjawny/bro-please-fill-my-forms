import { create } from "zustand";
import { ThemeType } from "~/lib/enums/Theme";
import { OneOf } from "~/lib/models/OneOf";
import { getDefaultUserPreferences, UserPreferences, UserPreferencesSchema } from "~/lib/models/UserPreferences";
import { loadUserPreferencesFromSyncStorage, saveToSyncStorage } from "~/lib/services/chrome-storage-sync";
import { logError } from "~/lib/utils/log";

type UserPreferencesStore = UserPreferences & {
  isInitialized: boolean;
  fatalError?: string;

  /**
   * Sets the state w any previously saved data
   */
  initialize: () => Promise<OneOf<string, string>>;

  /**
   * Sets the theme in-memory and in browser storage
   */
  setTheme: (theme: ThemeType) => Promise<OneOf<string, string>>;

  /**
   * Signal to other UI that a fatal error has occurred
   */
  setFatalError: (error?: string) => OneOf<string, string>;

  /**
   * Get a JSON dump of this store, render in <pre> tags for fast debugging/insights
   */
  GET_DEBUG_JSON_DUMP: () => string;
};

export const useUserPreferencesStore = create<UserPreferencesStore>((set, get) => ({
  ...getDefaultUserPreferences(),
  isInitialized: false,
  fatalError: undefined,

  initialize: async (): Promise<OneOf<string, string>> => {
    let messages = ["Begin initializing UserPreferencesStore"];

    try {
      set({ isInitialized: false });

      const loadUserPreferencesResponse = await loadUserPreferencesFromSyncStorage();

      messages = messages.concat(loadUserPreferencesResponse.messages);

      // Fallback to defaults
      let userPreferences = getDefaultUserPreferences();

      if (loadUserPreferencesResponse.isOk) {
        userPreferences = loadUserPreferencesResponse.value;
      }

      set({ isInitialized: true, ...userPreferences });

      const successMessage = "Successfully initialized UserPreferencesStore";
      messages.push(successMessage);
      return { isOk: true, value: successMessage, messages };
    } catch (error: unknown) {
      const errorMessage = logError(error, "Failed to initialize UserPreferencesStore");
      messages.push(errorMessage);
      return { isOk: false, error: errorMessage, messages };
    }
  },

  setTheme: async (theme: ThemeType): Promise<OneOf<string, string>> => {
    let messages = ["Begin setting Theme"];

    try {
      const nextState = { theme: theme };

      const saveToBrowserStorageResponse = await saveToSyncStorage(UserPreferencesSchema, nextState);

      messages = messages.concat(saveToBrowserStorageResponse.messages);

      if (!saveToBrowserStorageResponse.isOk) {
        const failMessage = "Failed to set Theme";
        messages.push(failMessage);
        return { isOk: false, error: failMessage, messages };
      }

      set({ ...nextState });

      const successMessage = "Successfully set Theme";
      messages.push(successMessage);
      return { isOk: true, value: successMessage, messages };
    } catch (error: unknown) {
      const errorMessage = logError(error, "Failed to set Theme");
      messages.push(errorMessage);
      return { isOk: false, error: errorMessage, messages };
    }
  },

  setFatalError: (error?: string): OneOf<string, string> => {
    let messages = ["Begin setting fatalError"];

    try {
      set({ fatalError: error });
      const successMessage = "Successfully set fatalError";
      messages.push(successMessage);
      return { isOk: true, value: successMessage, messages };
    } catch (error: unknown) {
      const errorMessage = logError(error, "Failed to set fatalError");
      messages.push(errorMessage);
      return { isOk: false, error: errorMessage, messages };
    }
  },

  GET_DEBUG_JSON_DUMP: () => JSON.stringify(get(), null, 2),
}));
