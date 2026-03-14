import "./web-components/window-manager/window-manager.js";

import { loadAndMountTemplates } from "./util/templateLoader.js";
import { TemplateManager } from "./util/templateManager.js";
import { initializeSidebarSystemInfo } from "./terminal/sidebarSystemInfo.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadAndMountTemplates();

    const sidebarHost = document.getElementById("sidebar");
    const sidebarRoot = TemplateManager.createRoot("sidebar-system-info");
    if (sidebarRoot && sidebarHost) {
      sidebarRoot.setAttribute("slot", "sidebar");
      TemplateManager.mount(sidebarRoot, sidebarHost);
      initializeSidebarSystemInfo(sidebarRoot);
    }

    // Lazy-load xterm and the terminal bootstrap so the heavy xterm chunk
    // is only fetched after the shell UI is already rendered.
    const { startTerminal } = await import("./terminal/index.js");
    await startTerminal();
  } catch (err) {
    console.error("Initialization failed", err);
  }
});
