export const LOCAL_STORAGE_KEY = "digi-worlds-user-preferences";

export type UserPreferencesType = {
  theme: "light" | "dark" | "system";
  isGeorge: boolean; // TODO:
  avatarFaceBlob?: string; // TODO:
  language?: string; // TODO:
};

export const defaultUserPreferences: UserPreferencesType = {
  theme: "system",
  isGeorge: false,
};
