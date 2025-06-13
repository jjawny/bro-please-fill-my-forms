import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { Theme } from "~/lib/enums/Theme";
import { useUserPreferencesStore } from "~/lib/stores/UserPreferencesStore";

export default function ToggleThemeButton() {
  const { theme, setTheme } = useUserPreferencesStore();

  const handleThemeChange = () => {
    const themes = [Theme.light, Theme.dark, Theme.system];
    const currIndex = themes.indexOf(theme);
    const nextIndex = (currIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case Theme.light:
        return <SunIcon />;
      case Theme.dark:
        return <MoonIcon />;
      default:
        return <MonitorIcon />;
    }
  };

  return (
    <RippleButton
      title="Toggle Theme"
      size="icon"
      variant="secondary"
      aria-label={`Switch from ${theme.toLowerCase()} theme`}
      onClick={handleThemeChange}
      className="size-8 absolute top-0 right-0 z-50 m-2"
    >
      {getThemeIcon()}
    </RippleButton>
  );
}
