import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { RippleButton } from "~/lib/components/shadcn/ripple";
import { Theme } from "~/lib/enums/Theme";
import { useGlobalStore } from "~/lib/hooks/stores/useGlobalStore";
import { useTheme } from "~/lib/hooks/useTheme";
import { logResponse } from "~/lib/utils/log-utils";

export default function ToggleThemeButton() {
  const { theme, setTheme } = useTheme();

  const setGlobalError = useGlobalStore((state) => state.setGlobalError);

  const handleToggleTheme = async () => {
    const themes = [Theme.LIGHT, Theme.DARK, Theme.SYSTEM];
    const currIndex = themes.indexOf(theme);
    const nextIndex = (currIndex + 1) % themes.length;
    const setThemeResponse = await setTheme(themes[nextIndex]);

    logResponse(setThemeResponse);

    if (!setThemeResponse.isOk) {
      setGlobalError(setThemeResponse.uiMessage);
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
