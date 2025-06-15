import { Theme } from "~/lib/enums/Theme";
import { usePinStore } from "~/lib/hooks/stores/usePinStore";
import { useUserPreferencesStore } from "~/lib/hooks/stores/useUserPreferencesStore";
import { useTheme } from "~/lib/hooks/useTheme";
import { cn } from "~/lib/utils/cn";
import githubLogo from "/images/github-logo.svg";

export default function Footer() {
  const { theme } = useTheme();
  const pinStoreFatalError = usePinStore((state) => state.fatalError);
  const userPreferencesStoreFatalError = useUserPreferencesStore((state) => state.fatalError);

  return (
    <footer className="sticky bottom-0 w-full p-4 flex z-[9999] justify-center">
      <a href="https://vitejs.dev" target="_blank">
        <img
          src={githubLogo}
          alt="GitHub repo"
          className={cn("select-none pointer-events-auto h-4", theme !== Theme.DARK && "invert")}
        />
      </a>
      {/* TODO: make this nice for the user
      as this is a chrome extension, do we use toasts or just display the latest error at bottom of screen? (toasts are probably bad UX in chrome extensions) */}
      {pinStoreFatalError && <span className="text-red-500 ml-2">Pin Store Error: {pinStoreFatalError}</span>}
      {userPreferencesStoreFatalError && (
        <span className="text-red-500 ml-2">UserPreferences Store Error: {userPreferencesStoreFatalError}</span>
      )}
    </footer>
  );
}
