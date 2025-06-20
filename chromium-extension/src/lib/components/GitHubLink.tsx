import { Theme } from "~/lib/enums/Theme";
import { useTheme } from "~/lib/hooks/useTheme";
import { cn } from "~/lib/utils/cn";
import githubLogo from "/images/github-logo.svg";

export default function GitHubLink() {
  const { theme } = useTheme();

  return (
    <a href="https://github.com/jjawny/bro-please-fill-my-forms-RnD" target="_blank">
      <img
        src={githubLogo}
        alt="View the GitHub repo"
        className={cn(
          "select-none pointer-events-auto ",
          "absolute bottom-0 right-0 z-50",
          "h-4 m-4",
          theme !== Theme.DARK && "invert",
        )}
      />
    </a>
  );
}
