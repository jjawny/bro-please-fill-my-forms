import { z } from "zod/v4";

// Better enums
export const Theme = {
  light: "light",
  dark: "dark",
  system: "system",
} as const;

// For validation
export const ThemeSchema = z.enum([Theme.light, Theme.dark, Theme.system]);

// For type safety
export type ThemeType = (typeof Theme)[keyof typeof Theme];
