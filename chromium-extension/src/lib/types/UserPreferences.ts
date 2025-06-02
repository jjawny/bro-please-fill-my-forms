import { Theme } from "../enums/Theme";

export type UserPreferences = {
  theme: Theme;
  isGeorge: boolean;
  geminiApiKey?: string;
  // avatarFaceBlob?: string; // TODO:
  // language?: string; // TODO:
};

export const defaultUserPreferences: UserPreferences = {
  theme: Theme.Light,
  isGeorge: false,
  geminiApiKey: "",
};
