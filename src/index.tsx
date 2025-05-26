import "./index.css";
import "./web-components/window-manager/window-manager.js";

import { App } from "./App";
import { TemplateManager } from "./util/templateManager.ts";
import { createRoot } from "react-dom/client";

document.addEventListener("DOMContentLoaded", async () => {
  await TemplateManager.loadTemplatesBatch([
    "/templates/terminal.html",
    "/templates/settings-menu.html",
  ]);

  const contentNode = document.getElementById("content");
  const settingsNode = document.getElementById("settings");

  if (!contentNode || !settingsNode) {
    console.error(
      "Missing container elements: #content or #settings-menu not found."
    );
    return;
  }

  const terminalClone = TemplateManager.create("terminal");
  const settingsMenuClone = TemplateManager.create("settings-menu");

  if (!terminalClone || !settingsMenuClone) {
    console.error("One or more templates not found.");
    return;
  }

  TemplateManager.mount(settingsMenuClone, settingsNode);
  TemplateManager.mount(terminalClone, contentNode);
});

const appRoot = document.getElementById("react")!;
const root = createRoot(appRoot);

root.render(<App />);
