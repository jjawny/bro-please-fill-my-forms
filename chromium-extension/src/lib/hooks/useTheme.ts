import { useEffect } from "react";
import { Theme } from "~/lib/enums/Theme";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";

export const useTheme = () => {
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);

  const applyTheme = () => {
    const root = document.documentElement;

    if (theme === Theme.SYSTEM) {
      const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const systemTheme = isDarkMode ? Theme.DARK : Theme.LIGHT;
      root.setAttribute("theme", systemTheme);
    } else {
      root.setAttribute("theme", theme);
    }
  };

  // Apply the theme ASAP upon selection
  useEffect(applyTheme, [theme]);

  // When system theme is selected; listen to system theme changes
  useEffect(
    function listenToSystemThemeChanges() {
      if (theme !== Theme.SYSTEM) return;

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", applyTheme);

      return () => {
        mediaQuery.removeEventListener("change", applyTheme);
      };
    },
    [theme],
  );

  return { theme, setTheme };
};
