import { create } from "zustand";
import { ThemeType } from "~/lib/enums/Theme";
import { err, ErrOr, Messages, ok } from "~/lib/models/ErrOr";
import { getDefaultUserPreferences, UserPreferences, UserPreferencesSchema } from "~/lib/models/UserPreferences";
import { loadUserPreferencesFromSyncStorage, saveToSyncStorage } from "~/lib/services/chrome-storage-sync-service";
import { logError } from "~/lib/utils/log-utils";

type UserPreferencesStore = UserPreferences & {
  isInitialized: boolean;

  /**
   * Sets the state w any previously saved data
   */
  initialize: () => Promise<ErrOr>;

  /**
   * Sets the theme in-memory and in browser storage
   */
  setTheme: (theme: ThemeType) => Promise<ErrOr>;

  /**
   * Get a dump of this store
   */
  GET_DEBUG_DUMP: () => object;
};

export const useUserPreferencesStore = create<UserPreferencesStore>((set, get) => ({
  ...getDefaultUserPreferences(),
  isInitialized: false,

  initialize: async (): Promise<ErrOr> => {
    let messages: Messages = ["Begin initializing UserPreferencesStore"];

    try {
      set({ isInitialized: false });

      const loadUserPreferencesResponse = await loadUserPreferencesFromSyncStorage();

      messages.push(loadUserPreferencesResponse.messages);

      if (!loadUserPreferencesResponse.isOk) {
        return err({ messages, uiMessage: loadUserPreferencesResponse.uiMessage, isAddUiMessageToMessages: false });
      }

      const userPreferences = loadUserPreferencesResponse.value;

      set({ isInitialized: true, ...userPreferences });

      return ok({ messages, uiMessage: "Successfully initialized UserPreferencesStore" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to initialize UserPreferencesStore") });
    }
  },

  setTheme: async (theme: ThemeType): Promise<ErrOr> => {
    let messages: Messages = ["Begin setting Theme"];

    try {
      const nextState = { theme: theme };

      const saveToBrowserStorageResponse = await saveToSyncStorage(UserPreferencesSchema, nextState);

      messages.push(saveToBrowserStorageResponse.messages);

      if (!saveToBrowserStorageResponse.isOk) {
        return err({
          messages,
          uiMessage: saveToBrowserStorageResponse.uiMessage,
          isAddUiMessageToMessages: false,
        });
      }

      set({ ...nextState });

      return ok({ messages, uiMessage: "Successfully set Theme" });
    } catch (error: unknown) {
      return err({ messages, uiMessage: logError(error, "Failed to set Theme") });
    }
  },

  GET_DEBUG_DUMP: () => ({ ...get() }),
}));
