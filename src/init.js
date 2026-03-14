import "./web-components/window-manager/window-manager.js";

import { loadAndMountTemplates } from "./util/templateLoader.js";
import { TemplateManager } from "./util/templateManager.js";
import { startTerminal } from "./terminal/index.js";
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

    await startTerminal();
  } catch (err) {
    console.error("Initialization failed", err);
  }
});
