import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import { bootKernel } from "../os/boot";

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
};

const OK = `${C.green}[  OK  ]${C.reset}`;
const FAIL = `${C.red}[ FAIL ]${C.reset}`;
const PAD = "         "; // 8 chars — aligns with "[  OK  ]"

// ---------------------------------------------------------------------------
// Terminal setup
// ---------------------------------------------------------------------------

export async function startTerminal() {
  const container = document.getElementById("terminal-container");
  if (!container) {
    console.error("terminal-container element not found");
    return;
  }

  container.innerHTML = "";
  Object.assign(container.style, {
    height: "100%",
    width: "100%",
    overflow: "hidden",
    background: "transparent",
  });

  function getColors() {
    const s = getComputedStyle(document.documentElement);
    const foreground = s.getPropertyValue("--text-color").trim() || "#fff";
    const background =
      s.getPropertyValue("--background-color").trim() || "rgba(0,0,0,0)";
    return {
      foreground,
      background,
      cursor: foreground,
      selectionBackground: foreground,
      selectionForeground: background,
    };
  }

  const term = new Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily: getComputedStyle(document.body).fontFamily,
    fontSize: 16,
    fontWeight: "500",
    allowTransparency: true,
    screenReaderMode: true,
    theme: getColors(),
    termName: "xterm-256color",
    linkHandler: {
      activate: (_event, uri) =>
        window.open(uri, "_blank", "noopener,noreferrer"),
    },
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  let _themeRaf = null;
  function syncTheme() {
    if (_themeRaf) return;
    _themeRaf = requestAnimationFrame(() => {
      _themeRaf = null;
      const {
        foreground,
        background,
        cursor,
        selectionBackground,
        selectionForeground,
      } = getColors();
      term.options.theme = {
        ...term.options.theme,
        foreground,
        background,
        cursor,
        selectionBackground,
        selectionForeground,
      };
      const el = container.querySelector(".xterm-scrollable-element");
      if (el) el.style.background = background;
    });
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", syncTheme);
  new MutationObserver(syncTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  term.open(container);
  fitAddon.fit();
  term.focus();
  syncTheme();

  const titleEl = document.getElementById("terminal-title");
  const defaultTitle = document.title;
  const ignoredTitleSet = new Set([
    "xterm-256color — wasm:/dev/tty",
  ]);

  // The shell's idle title ("user@host: ~") stays in the title bar only; the tab keeps the site name.
  const promptTitlePattern = /^\S+@\S+: /;

  function setDocumentTitle(title) {
    const ignored = ignoredTitleSet.has(title) || promptTitlePattern.test(title);
    document.title = ignored ? defaultTitle : title;
  }

  term.onTitleChange((title) => {
    titleEl.textContent = title;
    setDocumentTitle(title);
  });

  let _fitRaf = null;
  new ResizeObserver(() => {
    if (_fitRaf) cancelAnimationFrame(_fitRaf);
    _fitRaf = requestAnimationFrame(() => {
      _fitRaf = null;
      fitAddon.fit();
    });
  }).observe(container);

  // ---------------------------------------------------------------------------
  // Wait for keypress — nothing loads or runs until the user initiates
  // ---------------------------------------------------------------------------

  term.write("\x1b]0;xterm-256color — wasm:/dev/tty\x07");
  term.write("Press any key to boot...");

  await new Promise((resolve) => {
    const d = term.onData((data) => {
      if (data.startsWith("\x1b")) return; // ignore escape sequences
      d.dispose();
      resolve();
    });
  });

  term.write(`\r${C.dim}Press any key to boot...${C.reset}\r\n\r\n`);
  await boot(term);
}

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------

async function boot(term) {
  const ln = (s = "") => term.write(s + "\r\n");
  const setTitle = (t) => term.write(`\x1b]0;${t}\x07`);

  // The real steps take milliseconds; pause on each so the boot log can be read.
  async function step(label, fn) {
    setTitle(`${label}...`);
    term.write(`${PAD}${label}`);
    try {
      await delay(150 + Math.random() * 250);
      await fn();
      term.write(`\r${OK} ${label}\r\n`);
    } catch (err) {
      term.write(`\r${FAIL} ${label}\r\n`);
      ln(`${PAD}  ${C.red}${err.message}${C.reset}`);
      throw err;
    }
  }

  try {
    setTitle("Booting...");

    // SharedArrayBuffer — required later for a WASM shell's synchronous I/O
    await step("Checking SharedArrayBuffer support", async () => {
      if (typeof SharedArrayBuffer === "undefined") {
        throw new Error(
          "SharedArrayBuffer unavailable — coi-serviceworker may not be active",
        );
      }
    });

    // Mount filesystems and start PID 1 (see src/os/boot.ts). A WASM dash
    // would load here as a second executable format alongside JS modules.
    await bootKernel(term, step);
  } catch (err) {
    console.error("[boot]", err);
    ln();
    ln(`${C.red}Boot failed.${C.reset} See console for details.`);
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
