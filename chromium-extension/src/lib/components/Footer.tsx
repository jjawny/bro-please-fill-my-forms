import { Theme } from "../enums/Theme";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../utils/cn";
import githubLogo from "/images/github-logo.svg";

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="sticky bottom-0 w-full p-4 flex justify-center">
      <a href="https://vitejs.dev" target="_blank">
        <img
          src={githubLogo}
          className={cn("select-none pointer-events-auto h-4", theme !== Theme.dark && "invert")}
          alt="GitHub repo"
        />
      </a>
    </footer>
  );
}
