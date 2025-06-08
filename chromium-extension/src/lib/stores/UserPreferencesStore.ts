import { create } from "zustand";
import { ThemeType } from "../enums/Theme";
import { getDefaultUserPreferences, UserPreferences, UserPreferencesSchema } from "../types/UserPreferences";
import { safelyLoadUserPreferencesFromSyncStorage, saveToSyncStorage } from "../utils/chrome-storage-sync";

type UserPreferencesStore = UserPreferences & {
  isInitialized: boolean;
  /**
   * Sets the state w any previously saved data
   */
  initialize: () => Promise<void>;
  /**
   * Sets the theme in-memory and in browser storage
   */
  setTheme: (theme: ThemeType) => Promise<void>;
};

export const useUserPreferencesStore = create<UserPreferencesStore>((set) => ({
  ...getDefaultUserPreferences(),
  isInitialized: false,

  initialize: async () => {
    set({ isInitialized: false });

    const userPreferences = await safelyLoadUserPreferencesFromSyncStorage();

    set({ isInitialized: true, ...userPreferences });
  },

  setTheme: async (theme: ThemeType): Promise<void> => {
    const nextState = { theme: theme };

    await saveToSyncStorage(UserPreferencesSchema, nextState);

    set({ ...nextState });
  },
}));
