import settings from "./config.json";

export function renderTerminal(container, styles) {
  Object.assign(container.style, {
    position: "relative",
    height: "100%",
  });
  container.innerHTML = "";

  const terminalOutput = document.createElement("pre");
  terminalOutput.id = "terminal-output";
  terminalOutput.setAttribute("role", "log");
  terminalOutput.setAttribute("aria-live", "polite");
  terminalOutput.setAttribute("aria-atomic", "false");

  Object.assign(terminalOutput.style, {
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    maxWidth: `${settings.lineWidth}ch`,
    height: "calc(100% - 1.5em)",
    boxSizing: "border-box",
    userSelect: "text",
    "margin-bottom": "1em",
    "overflow-y": "auto",
    "white-space": "normal",
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
    fontStyle: styles.fontStyle,
    color: styles.color,
    marginTop: "4px",
  });

  const promptSpan = document.createElement("span");
  promptSpan.setAttribute("aria-hidden", "true");
  promptSpan.style.userSelect = "none";
  promptSpan.style.fontWeight = "bold";
  const user = "guest";
  const host = window.location.hostname || "localhost";
  const path = `~${window.location.pathname}` || "~";
  const isAdmin = false;
  promptSpan.textContent = `${user}@${host}:${path}${isAdmin ? "#" : "$"}`;

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
    paddingLeft: "8px",
    fontWeight: 600,
    userSelect: "text",
    outline: "none",
  });

  inputContainer.appendChild(terminalInput);
  inputWrapper.appendChild(promptSpan);
  inputWrapper.appendChild(inputContainer);

  container.appendChild(terminalOutput);
  container.appendChild(inputWrapper);
}
