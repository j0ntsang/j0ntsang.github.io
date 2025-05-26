import "./index.css";
import "./web-components/window-manager/window-manager.js";

import { App } from "./App";
import { TemplateManager } from "./util/templateManager.ts";
import { createRoot } from "react-dom/client";
import { initializeFullscreenToggle } from "./util/fullscreenToggle.ts";
import { initializeSettingsMenu } from "./util/settingsMenu.ts";

document.addEventListener("DOMContentLoaded", async () => {
  await TemplateManager.loadTemplatesBatch([
    "/templates/fullscreen-toggle.html",
    "/templates/terminal.html",
    "/templates/settings-menu.html",
  ]);

  const contentNode = document.getElementById("content");
  const fullscreenNode = document.getElementById("fullscreen");
  const settingsNode = document.getElementById("settings");

  if (!contentNode || !settingsNode || !fullscreenNode) {
    console.error("Template Manager failed to load batch.");
    return;
  }

  const terminalClone = TemplateManager.create("terminal");
  const fullscreenClone = TemplateManager.create("fullscreen-toggle");
  const settingsMenuClone = TemplateManager.create("settings-menu");

  if (!terminalClone || !settingsMenuClone || !fullscreenClone) {
    console.error("Template Manager failed to create a clone");
    return;
  }

  TemplateManager.mount(fullscreenClone, fullscreenNode);
  initializeFullscreenToggle();
  TemplateManager.mount(settingsMenuClone, settingsNode);
  initializeSettingsMenu();
  TemplateManager.mount(terminalClone, contentNode);
});

const appRoot = document.getElementById("react")!;
const root = createRoot(appRoot);

root.render(<App />);
