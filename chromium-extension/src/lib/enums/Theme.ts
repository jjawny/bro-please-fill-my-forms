import { z } from "zod/v4";

export const Theme = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export const ThemeSchema = z.enum([Theme.LIGHT, Theme.DARK, Theme.SYSTEM]);

export const ThemeValues = Object.values(Theme) as readonly ThemeType[];

export type ThemeType = (typeof Theme)[keyof typeof Theme];
