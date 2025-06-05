import { z } from "zod";

// Better enums
export const Theme = {
  light: "light",
  dark: "dark",
  system: "system",
} as const;

// For validation
export const ThemeSchema = z.enum(
  Object.values(Theme) as [string, ...string[]]
);

// For type safety
export type ThemeType = (typeof Theme)[keyof typeof Theme];

// Mostly for UI
export const ThemeOptions = Object.values(Theme);
