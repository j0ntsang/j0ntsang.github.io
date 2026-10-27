import "./os/display/theme";
import "./styles/scrollbar.css";
import "./web-components/window-manager/window-manager.js";

import { loadAndMountTemplates } from "./util/templateLoader.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadAndMountTemplates();

    // Lazy-load xterm and the terminal bootstrap so the heavy xterm chunk
    // is only fetched after the shell UI is already rendered.
    const { startTerminal } = await import("./terminal/index.js");
    await startTerminal();
  } catch (err) {
    console.error("Initialization failed", err);
    showLoadError();
  }
});

// Without this the visitor sees an empty window and no reason why.
function showLoadError() {
  const windowManager = document.querySelector("window-manager");
  windowManager?.querySelector(':scope > [slot="main"]')?.remove();

  const message = document.createElement("p");
  message.slot = "main";
  message.setAttribute("role", "alert");
  message.textContent = "The terminal failed to load. Check your connection and reload.";
  windowManager?.append(message);
}
