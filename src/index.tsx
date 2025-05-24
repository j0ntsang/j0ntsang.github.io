import "./index.css";

import { App } from "./App";
import { TemplateManager } from "./util/templateManager.ts";
import { createRoot } from "react-dom/client";

document.addEventListener("DOMContentLoaded", async () => {
  await TemplateManager.loadTemplate("/templates/terminal.html");

  const terminalTemplate = document.getElementById(
    "terminal"
  ) as HTMLTemplateElement | null;
  const contentNode = document.getElementById("content");

  if (terminalTemplate && contentNode) {
    const term = document.importNode(terminalTemplate.content, true);
    contentNode.appendChild(term);
  } else {
    console.error("Missing #terminal template or #content container");
  }
});

const appRoot = document.getElementById("react")!;
const root = createRoot(appRoot);

root.render(<App />);
