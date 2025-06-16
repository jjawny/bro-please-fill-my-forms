import { useCallback, useEffect, useRef } from "react";

interface KeyboardShortcut {
  keys: string[];
  callback: () => void;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, preventDefault = true } = options;
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const normalizeKey = useCallback((key: string): string => {
    const keyMap: Record<string, string> = {
      alt: "Alt",
      option: "Alt", // Mac option key maps to Alt
      cmd: "Meta",
      command: "Meta",
      ctrl: "Control",
      control: "Control",
      shift: "Shift",
      space: " ",
      enter: "Enter",
      escape: "Escape",
      tab: "Tab",
      backspace: "Backspace",
      delete: "Delete",
      arrowup: "ArrowUp",
      arrowdown: "ArrowDown",
      arrowleft: "ArrowLeft",
      arrowright: "ArrowRight",
    };

    const normalized = key.toLowerCase();
    return keyMap[normalized] || key;
  }, []);

  const matchesShortcut = useCallback(
    (shortcut: KeyboardShortcut): boolean => {
      const normalizedShortcut = shortcut.keys.map(normalizeKey);
      const pressedKeys = Array.from(pressedKeysRef.current);

      return (
        normalizedShortcut.length === pressedKeys.length && normalizedShortcut.every((key) => pressedKeys.includes(key))
      );
    },
    [normalizeKey],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Clear previous keys and rebuild the current state
      pressedKeysRef.current.clear();

      // Add modifier keys first
      if (event.altKey) pressedKeysRef.current.add("Alt");
      if (event.ctrlKey) pressedKeysRef.current.add("Control");
      if (event.shiftKey) pressedKeysRef.current.add("Shift");
      if (event.metaKey) pressedKeysRef.current.add("Meta");

      // Add the main key (normalize it)
      const mainKey = normalizeKey(event.key);
      pressedKeysRef.current.add(mainKey);

      console.debug("Keys pressed:", Array.from(pressedKeysRef.current));

      // Check if any shortcut matches
      for (const shortcut of shortcuts) {
        if (matchesShortcut(shortcut)) {
          console.debug("Shortcut matched:", shortcut.description || shortcut.keys.join("+"));
          if (preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          }
          shortcut.callback();
          break;
        }
      }
    },
    [enabled, shortcuts, matchesShortcut, preventDefault, normalizeKey],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      pressedKeysRef.current.delete(event.key);

      // Remove modifier keys when released
      if (!event.altKey) pressedKeysRef.current.delete("Alt");
      if (!event.ctrlKey) pressedKeysRef.current.delete("Control");
      if (!event.shiftKey) pressedKeysRef.current.delete("Shift");
      if (!event.metaKey) pressedKeysRef.current.delete("Meta");
    },
    [enabled],
  );

  const handleBlur = useCallback(() => {
    // Clear all pressed keys when window loses focus
    pressedKeysRef.current.clear();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled, handleKeyDown, handleKeyUp, handleBlur]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pressedKeysRef.current.clear();
    };
  }, []);
}
