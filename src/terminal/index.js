import { Shell } from "./shell.js";
import { getBodyStyles } from "./util.js";
import { renderTerminal } from "./render.js";
import { setupTerminalEvents } from "./events.js";

export async function startTerminal(htmlPath) {
  const container = document.getElementById("terminal-container");
  if (!container) {
    console.error("terminal-container element not found");
    return;
  }

  const styles = getBodyStyles();
  renderTerminal(container, styles);

  const outputEl = container.querySelector("#terminal-output");
  const inputEl = container.querySelector("#terminal-input");
  const shell = new Shell();

  let initialHtml = "<strong>Hello, World</strong>";
  if (htmlPath) {
    try {
      const response = await fetch(htmlPath);
      if (response.ok) {
        initialHtml = await response.text();
      } else {
        console.warn(`Failed to load ${htmlPath}, using fallback text.`);
      }
    } catch (e) {
      console.error("Error loading HTML file:", e);
    }
  }

  setupTerminalEvents(
    container,
    inputEl,
    outputEl,
    shell,
    styles.color,
    initialHtml
  );
}
