import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "~/lib/styles";
import App2 from "./App2.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App2 />
  </StrictMode>,
);
