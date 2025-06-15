import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { Theme } from "~/lib/enums/Theme";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";

export default function ToggleThemeButton() {
  const { theme, setTheme } = useUserPreferencesStore();

  const handleThemeChange = async () => {
    const themes = [Theme.light, Theme.dark, Theme.system];
    const currIndex = themes.indexOf(theme);
    const nextIndex = (currIndex + 1) % themes.length;
    const setThemeResponse = await setTheme(themes[nextIndex]);
    if (!setThemeResponse.isOk) {
      console.warn(setThemeResponse.error, setThemeResponse.messages);
      // TODO: toast or set fatal error?
    } else {
      console.debug(setThemeResponse.value, setThemeResponse.messages);
      // TODO: toast or set fatal error?
    }
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
