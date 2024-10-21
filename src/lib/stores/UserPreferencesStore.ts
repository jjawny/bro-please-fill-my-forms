import { create } from "zustand";
import {
  defaultUserPreferences,
  UserPreferences,
} from "../types/UserPreferences";

export const LOCAL_STORAGE_KEY = "digi-worlds-user-preferences";

type UserPreferencesStoreType = {
  userPreferences: UserPreferences;
  setUserPreferences: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
};

//
/**
 * Loads the inital data - previously saved user preferences
 * FYI: Zustand store becomes a singleton after being initalised (when first component accesses the store)
 * @returns previously saved user preferences
 */
const loadInitialData = (): UserPreferences => {
  let res = defaultUserPreferences;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      res = JSON.parse(saved) as UserPreferences;
      console.log("Your previously saved preferences:", res);
    }
  } catch (err) {
    console.warn("Error loading your previously saved preferences:", err);
  } finally {
    return res;
  }
};

export const useUserPreferencesStore = create<UserPreferencesStoreType>(
  (set) => ({
    userPreferences: loadInitialData(),
    setUserPreferences: (key, value) =>
      set((state) => {
        const nextData = { ...state.userPreferences, [key]: value };

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextData));

        return { ...state, userPreferences: nextData };
      }),
  })
);
