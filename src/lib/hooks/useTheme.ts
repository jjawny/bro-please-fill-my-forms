import { useEffect } from "react";
import { Theme } from "../enums/Theme";
import { useUserPreferencesStore } from "../stores/UserPreferencesStore";

export const useTheme = () => {
  const theme = useUserPreferencesStore((state) => state.userPreferences.theme);
  const setUserPreferences = useUserPreferencesStore(
    (state) => state.setUserPreferences
  );

  useEffect(() => {
    document.body.classList.toggle(Theme.Dark, theme === Theme.Dark);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === Theme.Dark ? Theme.Light : Theme.Dark;
    setUserPreferences("theme", nextTheme);
  };

  return { theme, toggleTheme };
};
