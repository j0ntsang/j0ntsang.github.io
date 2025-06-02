import "./index.css";
import "./web-components/window-manager/window-manager.js";

import { App } from "./App";
import { createRoot } from "react-dom/client";

document.addEventListener("DOMContentLoaded", async () => {
  const appRoot = document.getElementById("react")!;
  const root = createRoot(appRoot);
  // root.render(<App />);
});
