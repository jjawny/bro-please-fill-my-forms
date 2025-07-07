import { useEffect } from "react";
import { Theme, ThemeType } from "~/lib/enums/Theme";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";

export const useTheme = () => {
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);

  // Apply theme ASAP upon selection
  useEffect(() => {
    applyThemeToHtmlDocument(theme);
  }, [theme]);

  // When system theme is selected; sync with system theme changes
  useEffect(
    function listenToSystemThemeChanges() {
      if (theme !== Theme.SYSTEM) return;

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyThemeToHtmlDocument(Theme.SYSTEM);
      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    },
    [theme],
  );

  return { theme, setTheme };
};

function applyThemeToHtmlDocument(theme: ThemeType) {
  const root = document.documentElement;
  if (theme === Theme.SYSTEM) {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const systemTheme = isDarkMode ? Theme.DARK : Theme.LIGHT;
    root.setAttribute("theme", systemTheme);
  } else {
    root.setAttribute("theme", theme);
  }
}
