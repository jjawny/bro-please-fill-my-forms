import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Theme } from "~/lib/enums/Theme";
import { useUserPreferencesStore } from "~/lib/stores/UserPreferencesStore";
import { RippleButton } from "../ui/shadcn/ripple";

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
      case "LIGHT":
        return <SunIcon />;
      case "DARK":
        return <MoonIcon />;
      default:
        return <MonitorIcon />;
    }
  };

  return (
    <RippleButton
      variant="secondary"
      size="icon"
      className="size-8 absolute top-0 right-0 z-50 m-2"
      onClick={handleThemeChange}
      aria-label={`Switch from ${theme.toLowerCase()} theme`}
    >
      {getThemeIcon()}
    </RippleButton>
  );
}
