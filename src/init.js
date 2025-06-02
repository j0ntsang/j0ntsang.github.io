import { loadAndMountTemplates } from "./util/templateLoader.js";
import { startTerminal } from "./terminal/index.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadAndMountTemplates();
    await startTerminal();
  } catch (err) {
    console.error("Initialization failed", err);
  }
});
