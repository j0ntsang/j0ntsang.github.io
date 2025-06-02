import { TemplateManager } from "./templateManager.js";

export async function loadAndMountTemplates() {
  await TemplateManager.loadTemplatesBatch([
    "/templates/fullscreen-toggle.html",
    "/templates/terminal.html",
    "/templates/settings-menu.html",
  ]);

  const contentNode = document.getElementById("content");
  const fullscreenNode = document.getElementById("fullscreen");
  const settingsNode = document.getElementById("settings");

  if (!contentNode || !settingsNode || !fullscreenNode) {
    throw new Error("Template Manager failed to find container nodes.");
  }

  const terminalClone = TemplateManager.create("terminal");
  const fullscreenClone = TemplateManager.create("fullscreen-toggle");
  const settingsMenuClone = TemplateManager.create("settings-menu");

  if (!terminalClone || !settingsMenuClone || !fullscreenClone) {
    throw new Error("Template Manager failed to create a clone");
  }

  TemplateManager.mount(fullscreenClone, fullscreenNode);
  TemplateManager.mount(settingsMenuClone, settingsNode);
  TemplateManager.mount(terminalClone, contentNode);
}
