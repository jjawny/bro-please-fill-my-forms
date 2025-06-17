import z from "zod/v4";

export const ModifierKey = {
  ALT: "alt",
  CONTROL: "control",
  SHIFT: "shift",
  META: "meta",
} as const;

export const ModifierKeyTypeSchema = z.enum([
  ModifierKey.ALT,
  ModifierKey.CONTROL,
  ModifierKey.SHIFT,
  ModifierKey.META,
]);

export const ModifierKeyValues = Object.values(ModifierKey) as readonly string[];

export type ModifierKeyType = (typeof ModifierKey)[keyof typeof ModifierKey];
