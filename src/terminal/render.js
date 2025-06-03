import settings from "./config.json";

export function renderTerminal(container, styles) {
  Object.assign(container.style, {
    position: "relative",
    height: "100%",
  });
  container.innerHTML = "";

  const terminalOutput = document.createElement("div");
  terminalOutput.id = "terminal-output";
  terminalOutput.setAttribute("aria-live", "polite");
  Object.assign(terminalOutput.style, {
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    maxWidth: `${settings.lineWidth}ch`,
    height: "calc(100% - 1.5em)",
    boxSizing: "border-box",
    userSelect: "text",
    "margin-bottom": "1em",
    "overflow-y": "auto",
  });

  const inputWrapper = document.createElement("div");
  Object.assign(inputWrapper.style, {
    position: "absolute",
    bottom: 0,
    left: 0,
    display: "flex",
    width: "100%",
    maxWidth: `${settings.lineWidth}ch`,
    maxHeight: "1em",
    fontFamily: styles.fontFamily,
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
    fontStyle: styles.fontStyle,
    color: styles.color,
    marginTop: "4px",
  });

  const promptSpan = document.createElement("span");
  promptSpan.setAttribute("aria-hidden", "true");
  promptSpan.style.userSelect = "none";
  promptSpan.textContent = "$ ";

  const inputContainer = document.createElement("div");
  inputContainer.id = "input-wrapper";
  inputContainer.style.flex = "1";

  const terminalInput = document.createElement("div");
  terminalInput.id = "terminal-input";
  terminalInput.contentEditable = true;
  terminalInput.spellcheck = false;
  terminalInput.setAttribute("role", "textbox");
  terminalInput.setAttribute("aria-multiline", "false");
  terminalInput.setAttribute("aria-label", "Terminal input");

  Object.assign(terminalInput.style, {
    caretColor: styles.color,
    color: styles.color,
    background: "transparent",
    userSelect: "text",
    outline: "none",
  });

  inputContainer.appendChild(terminalInput);
  inputWrapper.appendChild(promptSpan);
  inputWrapper.appendChild(inputContainer);

  container.appendChild(terminalOutput);
  container.appendChild(inputWrapper);
}
