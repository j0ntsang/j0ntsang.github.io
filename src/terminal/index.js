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

// Themed via --ansi-<name> in src/styles/themes.css.
const ANSI_COLORS = ["red", "green", "yellow", "blue", "magenta", "cyan"];

const OK = `${C.green}[  OK  ]${C.reset}`;
const WARN = `${C.yellow}[ WARN ]${C.reset}`;
const FAIL = `${C.red}[ FAIL ]${C.reset}`;
// A pending label starts where it will sit once "\r<badge> " overwrites it.
const STATUS_COLUMN_PAD = " ".repeat("[  OK  ] ".length);

// Settings' Animation toggle (and, until it's touched, prefers-reduced-motion)
// lives in the .animation class on <html>.
const animationEnabled = () =>
  document.documentElement.classList.contains("animation");

// ---------------------------------------------------------------------------
// Terminal setup
// ---------------------------------------------------------------------------

export async function startTerminal() {
  const container = document.getElementById("terminal-container");
  if (!container) throw new Error("terminal-container element not found");

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
    const ansi = {};
    for (const name of ANSI_COLORS) {
      const value = s.getPropertyValue(`--ansi-${name}`).trim();
      if (value) ansi[name] = ansi[`bright${name[0].toUpperCase()}${name.slice(1)}`] = value;
    }
    return {
      ...ansi,
      foreground,
      background,
      cursor: foreground,
      selectionBackground: foreground,
      selectionForeground: background,
    };
  }

  const term = new Terminal({
    cursorBlink: animationEnabled(),
    convertEol: true,
    fontFamily: getComputedStyle(document.body).fontFamily,
    fontSize: 16,
    fontWeight: "500",
    allowTransparency: true,
    screenReaderMode: true,
    minimumContrastRatio: 4.5,
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
      const colors = getColors();
      term.options.theme = { ...term.options.theme, ...colors };
      const { background } = colors;
      const el = container.querySelector(".xterm-scrollable-element");
      if (el) el.style.background = background;
    });
  }

  new MutationObserver(syncTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  // Mid-transition reads catch in-between colors; settle once it finishes.
  document.documentElement.addEventListener("transitionend", (e) => {
    if (e.target === document.documentElement) syncTheme();
  });

  // xterm blinks the cursor with its own CSS animation, which --motion can't
  // reach, so turn it off and on with the setting.
  new MutationObserver(() => {
    term.options.cursorBlink = animationEnabled();
  }).observe(document.documentElement, {
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

  const idlePromptTitle = /^\S+@\S+: /;

  function setDocumentTitle(title) {
    const ignored = ignoredTitleSet.has(title) || idlePromptTitle.test(title);
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

  // Real steps take milliseconds; the pause keeps the boot log readable.
  // A failed step stops the boot, unless it isn't fatal: then it only warns.
  async function step(label, fn, { fatal = true } = {}) {
    setTitle(`${label}...`);
    term.write(`${STATUS_COLUMN_PAD}${label}`);
    try {
      await delay(150 + Math.random() * 250);
      await fn();
      term.write(`\r${OK} ${label}\r\n`);
    } catch (err) {
      term.write(`\r${fatal ? FAIL : WARN} ${label}\r\n`);
      ln(`${STATUS_COLUMN_PAD}  ${fatal ? C.red : C.yellow}${err.message}${C.reset}`);
      if (fatal) throw err;
    }
  }

  try {
    setTitle("Booting...");

    // SharedArrayBuffer — a WASM shell's synchronous I/O will need it. Nothing
    // does yet, so a page that isn't cross-origin isolated still boots.
    await step(
      "Checking SharedArrayBuffer support",
      async () => {
        if (typeof SharedArrayBuffer === "undefined") {
          throw new Error(
            "SharedArrayBuffer unavailable — coi-serviceworker may not be active",
          );
        }
      },
      { fatal: false },
    );

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
