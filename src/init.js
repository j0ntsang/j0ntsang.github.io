import "./web-components/window-manager/window-manager.js";

import { loadAndMountTemplates } from "./util/templateLoader.js";
import { TemplateManager } from "./util/templateManager.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadAndMountTemplates();


    // Lazy-load xterm and the terminal bootstrap so the heavy xterm chunk
    // is only fetched after the shell UI is already rendered.
    const { startTerminal } = await import("./terminal/index.js");
    await startTerminal();
  } catch (err) {
    console.error("Initialization failed", err);
  }
});
