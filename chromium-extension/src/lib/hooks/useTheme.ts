import { useEffect } from "react";
import { Theme, ThemeType } from "~/lib/enums/Theme";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";

export const useTheme = () => {
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);

  const applySystemTheme = (e: MediaQueryListEvent | null = null) => {
    if (theme !== Theme.SYSTEM) return;

    const isDarkMode = e ? e.matches : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = isDarkMode ? Theme.DARK : Theme.LIGHT;
    document.documentElement.setAttribute("theme", nextTheme);
  };

  useEffect(
    function listenToSystemThemeChanges() {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", applySystemTheme);

      return () => {
        mediaQuery.removeEventListener("change", applySystemTheme);
      };
    },
    // TODO: do we need this dep?
    [theme],
  );

  useEffect(
    function syncTheme() {
      const root = document.documentElement;

      if (theme === Theme.SYSTEM) {
        // For system theme, detect and apply the current system preference
        applySystemTheme();
      } else {
        // For explicit light/dark themes, apply directly
        root.setAttribute("theme", theme);
      }
    },
    [theme],
  );

  const toggleTheme = (theme: ThemeType) => setTheme(theme);

  return { theme, toggleTheme };
};
