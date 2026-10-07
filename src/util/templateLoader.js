import { TemplateManager } from "./templateManager.js";
import { initializeFullscreenToggle } from "./fullscreenToggle.js";
import { initializeSettingsMenu } from "./settingsMenu.js";
import { initializeSidebarToggle } from "./sidebarToggle.js";

export async function loadAndMountTemplates() {
  await TemplateManager.loadTemplatesBatch([
    "templates/fullscreen-toggle.html",
    // Mounted only while the sidebar has content (see sidebarToggle.ts).
    "templates/sidebar-toggle.html",
    "templates/terminal.html",
    "templates/settings-menu.html",
  ]);

  const windowManager = document.querySelector("window-manager");

  const fullscreenNode = document.getElementById("fullscreen");
  const sidebarToggleNode = document.getElementById("sidebar");
  const settingsNode = document.getElementById("settings");

  if (!windowManager || !settingsNode || !fullscreenNode || !sidebarToggleNode) {
    throw new Error("Template Manager failed to find container nodes.");
  }

  const terminalRoot = TemplateManager.createRoot("terminal");
  if (terminalRoot) terminalRoot.setAttribute("slot", "main");
  const fullscreenClone = TemplateManager.create("fullscreen-toggle");
  const settingsMenuClone = TemplateManager.create("settings-menu");

  if (!terminalRoot || !settingsMenuClone || !fullscreenClone) {
    throw new Error("Template Manager failed to create a clone");
  }

  TemplateManager.mount(fullscreenClone, fullscreenNode);
  initializeFullscreenToggle();
  TemplateManager.mount(settingsMenuClone, settingsNode);
  initializeSettingsMenu();
  TemplateManager.mount(terminalRoot, windowManager);
  initializeSidebarToggle(windowManager, sidebarToggleNode);
}
