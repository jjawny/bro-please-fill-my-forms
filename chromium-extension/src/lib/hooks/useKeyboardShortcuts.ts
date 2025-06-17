import { useCallback, useEffect } from "react";
import { ModifierKey, ModifierKeyValues } from "~/lib/enums/ModifierKey";

export type KeyboardShortcut = {
  keys: string[];
  callback: () => void;
  disabled?: boolean;
  preventDefault?: boolean;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const activeKeys = getActiveKeysFromEvent(event);

      // console.debug("Active keys:", activeKeys);

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        if (isKeysMatchesShortcut(activeKeys, shortcut)) {
          // Explicit false check as on by default if undefined
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
          }
          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

function getActiveKeysFromEvent(event: KeyboardEvent): string[] {
  const keys = [];

  if (event.altKey) keys.push(ModifierKey.ALT);
  if (event.ctrlKey) keys.push(ModifierKey.CONTROL);
  if (event.shiftKey) keys.push(ModifierKey.SHIFT);
  if (event.metaKey) keys.push(ModifierKey.META);

  if (!ModifierKeyValues.includes(event.key)) {
    keys.push(event.key);
  }

  return keys;
}

function isKeysMatchesShortcut(activeKeys: string[], shortcut: KeyboardShortcut): boolean {
  return shortcut.keys.length === activeKeys.length && shortcut.keys.every((key) => activeKeys.includes(key));
}
