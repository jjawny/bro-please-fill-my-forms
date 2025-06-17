import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { Theme } from "~/lib/enums/Theme";
import { useTheme } from "~/lib/hooks/useTheme";

export default function ToggleThemeButton() {
  const { theme, setTheme } = useTheme();

  const handleToggleTheme = async () => {
    const themes = [Theme.LIGHT, Theme.DARK, Theme.SYSTEM];
    const currIndex = themes.indexOf(theme);
    const nextIndex = (currIndex + 1) % themes.length;
    const setThemeResponse = await setTheme(themes[nextIndex]);
    if (!setThemeResponse.isOk) {
      console.warn(setThemeResponse.uiMessage, setThemeResponse.messages);
      // TODO: toast or set global error?
    } else {
      console.debug(setThemeResponse.uiMessage, setThemeResponse.value, setThemeResponse.messages);
      // TODO: toast or set global error?
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case Theme.LIGHT:
        return <SunIcon />;
      case Theme.DARK:
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
      onClick={handleToggleTheme}
      className="size-8 absolute top-0 right-0 z-50 m-2"
    >
      {getThemeIcon()}
    </RippleButton>
  );
}
