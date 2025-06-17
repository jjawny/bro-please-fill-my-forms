import { useCallback, useEffect } from "react";

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

  if (event.altKey) keys.push("Alt");
  if (event.ctrlKey) keys.push("Control");
  if (event.shiftKey) keys.push("Shift");
  if (event.metaKey) keys.push("Meta");

  // Add non-modifer keys
  const isNonModifierKey = !["Alt", "Control", "Shift", "Meta"].includes(event.key);
  if (isNonModifierKey) keys.push(event.key);

  return keys;
}

function isKeysMatchesShortcut(activeKeys: string[], shortcut: KeyboardShortcut): boolean {
  return shortcut.keys.length === activeKeys.length && shortcut.keys.every((key) => activeKeys.includes(key));
}
