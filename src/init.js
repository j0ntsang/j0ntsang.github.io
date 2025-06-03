import "./web-components/window-manager/window-manager.js";

import { loadAndMountTemplates } from "./util/templateLoader.js";
import { startTerminal } from "./terminal/index.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadAndMountTemplates();
    await startTerminal("/templates/motd.html");
  } catch (err) {
    console.error("Initialization failed", err);
  }
});
