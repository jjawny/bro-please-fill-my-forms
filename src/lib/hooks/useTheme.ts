import { useEffect } from "react";
import { Theme } from "../enums/Theme";
import { useUserPreferencesStore } from "../stores/UserPreferencesStore";

export const useTheme = () => {
  const theme = useUserPreferencesStore((state) => state.userPreferences.theme);
  const setUserPreferences = useUserPreferencesStore(
    (state) => state.setUserPreferences
  );

  const applySystemTheme = (e: MediaQueryListEvent | null = null) => {
    if (theme !== Theme.System) return;

    const isDarkMode = e
      ? e.matches
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = isDarkMode ? Theme.Dark : Theme.Light;
    document.documentElement.setAttribute("theme", nextTheme);
  };

  useEffect(function listenToSystemThemeChanges() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applySystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", applySystemTheme);
    };
  }, []);

  useEffect(
    function syncTheme() {
      applySystemTheme();
      const root = document.documentElement;
      if (theme === Theme.Dark) root.setAttribute("theme", Theme.Dark);
      else if (theme === Theme.Light) root.setAttribute("theme", Theme.Light);
    },
    [theme]
  );

  const toggleTheme = (theme: Theme) => setUserPreferences("theme", theme);

  return { theme, toggleTheme };
};
