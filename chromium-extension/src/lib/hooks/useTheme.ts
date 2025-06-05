import { useEffect } from "react";
import { Theme, ThemeType } from "../enums/Theme";
import { useUserDataStore } from "../stores/UserPreferencesStore";

export const useTheme = () => {
  const theme = useUserDataStore((state) => state.UserData.theme);
  const setUserPreferences = useUserDataStore((state) => state.setUserData);

  const applySystemTheme = (e: MediaQueryListEvent | null = null) => {
    if (theme !== Theme.system) return;

    const isDarkMode = e
      ? e.matches
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = isDarkMode ? Theme.dark : Theme.light;
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
      if (theme === Theme.dark) root.setAttribute("theme", Theme.dark);
      else if (theme === Theme.light) root.setAttribute("theme", Theme.light);
    },
    [theme]
  );

  const toggleTheme = (theme: ThemeType) => setUserPreferences("theme", theme);

  return { theme, toggleTheme };
};
