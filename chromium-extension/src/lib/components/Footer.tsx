import githubLogo from "/images/github-logo.svg";

// TODO: we invert the GH logo when we toggle theme, but GPT a way to not let this invert the selection color (or just don't make the icon selectable)
export default function Footer() {
  return (
    <footer className="sticky bottom-0 w-full backdrop-blur-sm p-4 flex justify-center">
      <a href="https://vitejs.dev" target="_blank">
        <img src={githubLogo} className="logo invert h-4" alt="Vite logo" />
      </a>
    </footer>
  );
}
