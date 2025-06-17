export const ModifierKey = {
  ALT: "alt",
  CONTROL: "control",
  SHIFT: "shift",
  META: "meta",
} as const;

export const ModifierKeyValues = Object.values(ModifierKey) as readonly string[];

export type ModifierKeyType = (typeof ModifierKey)[keyof typeof ModifierKey];
