import { Shell } from "./shell.js";

export async function startTerminal() {
  console.log("starting terminal...");
  const container = document.getElementById("terminal-container");
  if (!container) {
    console.error("terminal-container element not found");
    return;
  }

  // Inherit styles from body
  const bodyStyle = getComputedStyle(document.body);
  const fontFamily = bodyStyle.fontFamily;
  const fontSize = bodyStyle.fontSize;
  const fontWeight = bodyStyle.fontWeight;
  const fontStyle = bodyStyle.fontStyle;
  const color = bodyStyle.color;
  const backgroundColor = bodyStyle.backgroundColor;

  // Clear container and setup terminal HTML
  container.innerHTML = `
    <div id="terminal-output" aria-live="polite" style="
      font-family: ${fontFamily};
      font-size: ${fontSize};
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      color: ${color};
      background-color: ${backgroundColor};
      white-space: pre-wrap;
      overflow-y: auto;
      max-height: 300px;
      padding: 10px;
      border: 1px solid #444;
      border-radius: 4px;
      box-sizing: border-box;
      user-select: text;
    "></div>
    <div style="
      display: flex;
      font-family: ${fontFamily};
      font-size: ${fontSize};
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      color: ${color};
      margin-top: 5px;
      ">
      <span aria-hidden="true" style="user-select:none;">$&nbsp;</span>
      <div id="input-wrapper" style="flex: 1;">
        <div id="terminal-input" contenteditable="true" spellcheck="false" role="textbox" aria-multiline="false" aria-label="Terminal input" style="
          outline: none;
          white-space: pre-wrap;
          caret-color: ${color};
          color: ${color};
          background: transparent;
          min-height: 1em;
          user-select: text;
          "></div>
      </div>
    </div>
  `;

  const outputEl = container.querySelector("#terminal-output");
  const inputEl = container.querySelector("#terminal-input");

  const shell = new Shell();

  function appendLine(html) {
    const line = document.createElement("div");
    line.innerHTML = html;
    outputEl.appendChild(line);
    // Scroll to bottom
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  // Initialize with Hello, World
  appendLine("<strong>Hello, World</strong>");

  // Focus input on container click
  container.addEventListener("click", () => {
    inputEl.focus();
  });

  inputEl.focus();

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const command = inputEl.textContent.trim();
      if (command.length === 0) {
        inputEl.textContent = "";
        return;
      }

      appendLine(
        `<span style="color: ${color}">$ ${escapeHtml(command)}</span>`
      );
      const output = shell.execute(command);

      output.split("\n").forEach((line) => {
        appendLine(escapeHtml(line));
      });

      inputEl.textContent = "";
    } else if (e.key === "Backspace") {
      // Let browser handle backspace naturally
    }
  });

  // Escape HTML special chars
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
