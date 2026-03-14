import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

import { Shell, CLEAR_SENTINEL } from "./shell.js";
import { getPrompt } from "./util.js";
import config from "./config.json";

export async function startTerminal(htmlPath) {
  const container = document.getElementById("terminal-container");
  if (!container) {
    console.error("terminal-container element not found");
    return;
  }

  container.innerHTML = "";
  container.style.height = "100%";
  container.style.width = "100%";
  container.style.overflow = "hidden";
  container.style.background = "transparent";

  function getTerminalColors() {
    const rootStyles = getComputedStyle(document.documentElement);
    const foreground =
      rootStyles.getPropertyValue("--text-color").trim() || rootStyles.color || "#fff";
    const background =
      rootStyles.getPropertyValue("--background-color").trim() || "rgba(0,0,0,0)";
    return { foreground, background };
  }

  const baseTheme = getTerminalColors();

  const term = new Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily: getComputedStyle(document.body).fontFamily,
    allowTransparency: true,
    theme: baseTheme,
  });

  function setTerminalScrollBackground(bg) {
    const scrollEl = container.querySelector(".xterm-scrollable-element");
    if (scrollEl) {
      scrollEl.style.background = bg;
    }
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  function updateTerminalTheme() {
    const { foreground, background } = getTerminalColors();
    term.options.theme = { ...term.options.theme, foreground, background };
    setTerminalScrollBackground(background);
  }

  // Update when OS theme changes
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", updateTerminalTheme);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(updateTerminalTheme);
  }

  // Update when the user toggles between `html.dark` / `html.light`.
  const themeMutationObserver = new MutationObserver((records) => {
    for (const record of records) {
      if (record.attributeName === "class") {
        updateTerminalTheme();
        return;
      }
    }
  });
  themeMutationObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // Apply immediately
  updateTerminalTheme();
  term.open(container);

  // Ensure the terminal scrollable element matches the current theme background.
  // xterm may set an inline background on its scrollable element; we keep it in sync.
  const syncScrollBackground = () => {
    setTerminalScrollBackground(getTerminalColors().background);
  };

  syncScrollBackground();

  const observer = new MutationObserver(syncScrollBackground);
  observer.observe(container, { childList: true, subtree: true });
  window.addEventListener("beforeunload", () => {
    observer.disconnect();
    themeMutationObserver.disconnect();
  });

  // Replicate FitAddon: read cell dimensions from xterm internals and resize.
  // Deferred via requestAnimationFrame so ResizeObserver doesn't loop.
  function fitTerminal() {
    const dims = term._core?._renderService?.dimensions?.css?.cell;
    if (!dims?.width || !dims?.height) return;
    const cols = Math.max(2, Math.floor(container.clientWidth / dims.width));
    const rows = Math.max(1, Math.floor(container.clientHeight / dims.height));
    if (term.cols !== cols || term.rows !== rows) {
      term.resize(cols, rows);
    }
  }
  requestAnimationFrame(fitTerminal);

  const shell = new Shell();

  const motdPath = htmlPath || config.welcomeMessage;
  let initialText = "";

  function resolveUrl(path) {
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    return new URL(normalizedPath, document.baseURI).toString();
  }

  function decodeEscapes(text) {
    // Allow MOTD files to contain readable \xNN escape sequences that become real bytes.
    return text.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  if (motdPath) {
    try {
      const response = await fetch(resolveUrl(motdPath));
      if (response.ok) {
        const raw = await response.text();
        initialText = decodeEscapes(raw);
      } else {
        console.warn(`Failed to load ${motdPath}, using fallback text.`);
      }
    } catch (e) {
      console.error("Error loading MOTD file:", e);
    }
  }

  if (!initialText) {
    initialText = "Welcome to the terminal. Type 'help' for available commands.";
  }

  const prompt = getPrompt({ user: "guest", isAdmin: false });
  let buffer = "";
  const history = [];
  let historyIndex = -1;

  function rewriteLine(text) {
    term.write("\x1b[2K\r" + prompt + text);
  }

  function writePrompt() {
    term.write("\n" + prompt);
  }

  function writeOutput(text) {
    term.write(text + "\n");
  }

  writeOutput(initialText.trim());
  writePrompt();
  term.focus();

  // onData is the xterm standard: receives decoded byte sequences for all input
  // including paste, IME composition, and special keys as escape sequences.
  term.onData((data) => {
    switch (data) {
      case "\r": { // Enter
        const command = buffer.trim();
        buffer = "";
        term.write("\r\n");
        if (command) {
          history.push(command);
          if (history.length > config.historySize) history.shift();
          historyIndex = -1;

          const output = shell.execute(command).trim();
          if (output === CLEAR_SENTINEL) {
            term.clear();
          } else {
            writeOutput(output);
          }
        }
        writePrompt();
        break;
      }
      case "\x7f": // Backspace
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          term.write("\b \b");
        }
        break;
      case "\x03": // Ctrl+C
        buffer = "";
        term.write("^C");
        writePrompt();
        break;
      case "\x1b[A": // Arrow up
        if (history.length === 0) break;
        if (historyIndex === -1) {
          historyIndex = history.length - 1;
        } else if (historyIndex > 0) {
          historyIndex -= 1;
        }
        buffer = history[historyIndex] || "";
        rewriteLine(buffer);
        break;
      case "\x1b[B": // Arrow down
        if (history.length === 0 || historyIndex === -1) break;
        if (historyIndex < history.length - 1) {
          historyIndex += 1;
          buffer = history[historyIndex] || "";
        } else {
          historyIndex = -1;
          buffer = "";
        }
        rewriteLine(buffer);
        break;
      default:
        // Ignore unhandled escape sequences
        if (data.startsWith("\x1b")) break;
        // Printable characters and paste (data may be multiple chars)
        buffer += data;
        term.write(data);
    }
  });

  const resizeObserver = new ResizeObserver(() => requestAnimationFrame(fitTerminal));
  resizeObserver.observe(container);
}
