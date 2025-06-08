import { z } from "zod";

// Better enums
export const Theme = {
  light: "LIGHT",
  dark: "DARK",
  system: "SYSTEM",
} as const;

// For validation
export const ThemeSchema = z.enum([Theme.light, Theme.dark, Theme.system]);

// For type safety
export type ThemeType = (typeof Theme)[keyof typeof Theme];

// Mostly for UI
export const ThemeOptions = Object.values(Theme);
