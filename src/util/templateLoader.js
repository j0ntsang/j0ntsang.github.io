import { TemplateManager } from "./templateManager.js";
import { initializeFullscreenToggle } from "./fullscreenToggle.js";
import { initializeSettingsMenu } from "./settingsMenu.js";
import { initializeSidebarToggle } from "./sidebarToggle.js";

export async function loadAndMountTemplates() {
  const windowManager = document.querySelector("window-manager");

  const fullscreenSlot = document.getElementById("fullscreen-toggle-slot");
  const sidebarToggleSlot = document.getElementById("sidebar-toggle-slot");
  const settingsSlot = document.getElementById("settings-menu-slot");

  if (!windowManager || !settingsSlot || !fullscreenSlot || !sidebarToggleSlot) {
    throw new Error("index.html is missing <window-manager> or a waybar slot.");
  }

  // Each template mounts as soon as it loads. Only the terminal is essential;
  // a waybar button that fails to load is left out.
  await Promise.all([
    loadOptional("fullscreen-toggle", () => {
      TemplateManager.mount(TemplateManager.create("fullscreen-toggle"), fullscreenSlot);
      initializeFullscreenToggle();
    }),
    loadOptional("settings-menu", () => {
      TemplateManager.mount(TemplateManager.create("settings-menu"), settingsSlot);
      initializeSettingsMenu();
    }),
    // Not mounted here: sidebarToggle.ts mounts it only while the sidebar has content.
    loadOptional("sidebar-toggle", () =>
      initializeSidebarToggle(windowManager, sidebarToggleSlot)
    ),
    TemplateManager.loadTemplate("templates/terminal.html").then(() => {
      const terminalRoot = TemplateManager.createRoot("terminal");
      terminalRoot.slot = "main";
      TemplateManager.mount(terminalRoot, windowManager);
    }),
  ]);
}

async function loadOptional(id, mount) {
  try {
    await TemplateManager.loadTemplate(`templates/${id}.html`);
  } catch (err) {
    console.warn(`Skipping the ${id} template:`, err);
    return;
  }
  mount();
}
