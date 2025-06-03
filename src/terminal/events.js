import { escapeHtml } from "./util.js";

export function setupTerminalEvents(
  container,
  inputEl,
  outputEl,
  shell,
  color,
  initialHtml = "<strong>Hello, World</strong>"
) {
  function appendLine(rawHtml) {
    const html = rawHtml.trim();
    if (html) {
      outputEl.insertAdjacentHTML("beforeend", html);
      outputEl.insertAdjacentText("beforeend", "\n");
      outputEl.scrollTop = outputEl.scrollHeight;
    }
  }

  appendLine(initialHtml);
  console.log("Terminal connected");

  container.addEventListener("click", () => inputEl.focus());
  inputEl.focus();

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const command = inputEl.textContent.trim();
      if (!command) {
        inputEl.textContent = "";
        return;
      }

      const escapedCommand = escapeHtml(command).trim();
      appendLine(`<span style="color: ${color}">$ ${escapedCommand}</span>`);

      const output = shell.execute(command).trim();
      output.split("\n").forEach((line) => {
        appendLine(escapeHtml(line));
      });

      inputEl.textContent = "";
    }
  });
}
