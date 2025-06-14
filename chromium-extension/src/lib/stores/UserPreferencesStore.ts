import { create } from "zustand";
import { ThemeType } from "~/lib/enums/Theme";
import { OneOf } from "~/lib/types/OneOf";
import { getDefaultUserPreferences, UserPreferences, UserPreferencesSchema } from "~/lib/types/UserPreferences";
import { loadUserPreferencesFromSyncStorage, saveToSyncStorage } from "~/lib/utils/chrome-storage-sync";
import { logError } from "~/lib/utils/console-helpers";

type UserPreferencesStore = UserPreferences & {
  isInitialized: boolean;

  /**
   * Sets the state w any previously saved data
   */
  initialize: () => Promise<OneOf<string, string>>;

  /**
   * Sets the theme in-memory and in browser storage
   */
  setTheme: (theme: ThemeType) => Promise<OneOf<string, string>>;
};

export const useUserPreferencesStore = create<UserPreferencesStore>((set) => ({
  ...getDefaultUserPreferences(),
  isInitialized: false,

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
}));
