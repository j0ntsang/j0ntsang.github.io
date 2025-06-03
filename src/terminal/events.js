import { escapeHtml } from "./util.js";

export function setupTerminalEvents(
  container,
  inputEl,
  outputEl,
  shell,
  color,
  initialHtml = "<strong>Hello, World</strong>"
) {
  function appendLine(html) {
    outputEl.insertAdjacentHTML("beforeend", html + "<br>");
    outputEl.scrollTop = outputEl.scrollHeight;
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

      appendLine(
        `<span style="color: ${color}">$ ${escapeHtml(command)}</span>`
      );

      const output = shell.execute(command);
      output.split("\n").forEach((line) => appendLine(escapeHtml(line)));

      inputEl.textContent = "";
    }
  });
}
