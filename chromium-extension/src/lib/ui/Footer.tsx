import githubLogo from "/images/github-logo.svg";

export default function Footer() {
  return (
    <footer>
      <a href="https://vitejs.dev" target="_blank">
        <img src={githubLogo} className="logo invert" alt="Vite logo" />
      </a>
    </footer>
  );
}
