import { Theme } from "~/lib/enums/Theme";
import { useTheme } from "~/lib/hooks/useTheme";
import { cn } from "~/lib/utils/cn";
import githubLogo from "/images/github-logo.svg";

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="sticky bottom-0 w-full p-4 flex justify-center">
      <a href="https://vitejs.dev" target="_blank">
        <img
          src={githubLogo}
          alt="GitHub repo"
          className={cn("select-none pointer-events-auto h-4", theme !== Theme.dark && "invert")}
        />
      </a>
    </footer>
  );
}
