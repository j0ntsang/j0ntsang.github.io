import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import config from "./config.json";
import { runPrompt } from "./prompt.js";

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const C = {
  reset:  "\x1b[0m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  dim:    "\x1b[2m",
};

const OK   = `${C.green}[  OK  ]${C.reset}`;
const FAIL = `${C.red}[ FAIL ]${C.reset}`;
const PAD  = "        "; // 8 chars — aligns with "[  OK  ]"

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

function progressBar(received, total, width) {
  if (total === 0) {
    // Indeterminate — animated spinner position based on time
    const pos = Math.floor((Date.now() / 80) % width);
    const bar = " ".repeat(pos) + "=" + " ".repeat(width - pos - 1);
    return `[${bar}] ${formatBytes(received)}`;
  }
  const pct = Math.min(received / total, 1);
  const filled = Math.floor(pct * width);
  const bar = "#".repeat(filled) + "-".repeat(width - filled);
  return `[${bar}] ${Math.floor(pct * 100)}% (${formatBytes(received)} / ${formatBytes(total)})`;
}

// ---------------------------------------------------------------------------
// Terminal setup
// ---------------------------------------------------------------------------

export async function startTerminal(htmlPath) {
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
    return {
      foreground: s.getPropertyValue("--text-color").trim() || "#fff",
      background: s.getPropertyValue("--background-color").trim() || "rgba(0,0,0,0)",
    };
  }

  const term = new Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily: getComputedStyle(document.body).fontFamily,
    fontSize: 16,
    allowTransparency: true,
    theme: getColors(),
    termName: "xterm-256color",
    linkHandler: {
      activate: (_event, uri) => window.open(uri, "_blank", "noopener,noreferrer"),
    },
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  function syncTheme() {
    const { foreground, background } = getColors();
    term.options.theme = { ...term.options.theme, foreground, background };
    const el = container.querySelector(".xterm-scrollable-element");
    if (el) el.style.background = background;
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncTheme);
  new MutationObserver(syncTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  syncTheme();
  term.open(container);
  fitAddon.fit();
  term.focus();

  const titleEl = document.getElementById("terminal-title");
  const defaultTitle = document.title;
  const ignoredTitleSet = new Set([
    "dash (wasm)",
    "xterm-256color — wasm:/dev/tty",
  ]);

  function setDocumentTitle(title) {
    document.title = ignoredTitleSet.has(title) ? defaultTitle : title;
  }

  term.onTitleChange((title) => {
    titleEl.textContent = title;
    setDocumentTitle(title);
  });

  new ResizeObserver(() => fitAddon.fit()).observe(container);

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

  term.write("\r\n\r\n");
  await boot(term, htmlPath || config.welcomeMessage);
}

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------

async function boot(term, motdPath) {
  const ln = (s = "") => term.write(s + "\r\n");
  const barWidth = () => Math.max(20, Math.min(30, term.cols - 30));
  const setTitle = (t) => term.write(`\x1b]0;${t}\x07`);

  // Write a step label, await fn(), overwrite line with status
  async function step(label, fn) {
    term.write(`${PAD}${label}`);
    try {
      await fn();
      term.write(`\r${OK} ${label}\r\n`);
    } catch (err) {
      term.write(`\r${FAIL} ${label}\r\n`);
      ln(`${PAD}  ${C.red}${err.message}${C.reset}`);
      throw err;
    }
  }

  // TODO: uncomment when WASM binary is available at public/wasm/dash.wasm
  // async function fetchWithProgress(label, url) {
  //   term.write(`${PAD}${label} ${progressBar(0, 0, barWidth())}`);
  //   const res = await fetch(url);
  //   if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  //   const total = parseInt(res.headers.get("Content-Length") || "0", 10);
  //   const reader = res.body.getReader();
  //   const chunks = [];
  //   let received = 0;
  //   while (true) {
  //     const { done, value } = await reader.read();
  //     if (done) break;
  //     chunks.push(value);
  //     received += value.length;
  //     term.write(`\r${PAD}${label} ${progressBar(received, total, barWidth())}`);
  //   }
  //   term.write(`\r${OK} ${label} ${progressBar(received, total, barWidth())}\r\n`);
  //   const out = new Uint8Array(received);
  //   let offset = 0;
  //   for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
  //   return out.buffer;
  // }

  // Simulated fetch — remove once the real WASM binary is available
  async function simulatedFetch(label, fakeTotal) {
    term.write(`${PAD}${label} ${progressBar(0, fakeTotal, barWidth())}`);
    let received = 0;
    while (received < fakeTotal) {
      await delay(40 + Math.random() * 40);
      const chunk = Math.floor(fakeTotal / 18) + Math.floor(Math.random() * (fakeTotal / 18));
      received = Math.min(received + chunk, fakeTotal);
      term.write(`\r${PAD}${label} ${progressBar(received, fakeTotal, barWidth())}`);
    }
    term.write(`\r${OK} ${label} ${progressBar(fakeTotal, fakeTotal, barWidth())}\r\n`);
  }

  try {
    setTitle("Booting...");

    // 1. SharedArrayBuffer — required for WASM synchronous I/O
    await step("Checking SharedArrayBuffer support", async () => {
      if (typeof SharedArrayBuffer === "undefined") {
        throw new Error(
          "SharedArrayBuffer unavailable — coi-serviceworker may not be active"
        );
      }
    });

    // 2. PTY module
    setTitle("Loading PTY...");
    await step("Loading PTY module", async () => {
      // TODO: const { openpty } = await import("xterm-pty");
      await delay(200);
    });

    // 3. Fetch dash WASM binary with progress
    //    Replace simulatedFetch with fetchWithProgress once binary is compiled:
    //    const wasmBuffer = await fetchWithProgress(
    //      "Fetching dash.wasm",
    //      `${import.meta.env.BASE_URL}wasm/dash.wasm`
    //    );
    setTitle("Fetching dash.wasm...");
    await simulatedFetch("Fetching dash.wasm", 427520); // ~418 KB — real dash WASM size

    // 4. Compile WASM module
    setTitle("Compiling WebAssembly...");
    await step("Compiling WebAssembly module", async () => {
      // TODO: const module = await WebAssembly.compile(wasmBuffer);
      await delay(350);
    });

    // 5. Mount virtual filesystem
    setTitle("Mounting filesystem...");
    await step("Mounting virtual filesystem", async () => {
      // TODO: FS.mkdir("/home/guest"); FS.writeFile("/etc/motd", ...); FS.chdir("/home/guest");
      await delay(120);
    });

    // 6. Start dash
    setTitle("Starting dash...");
    await step("Starting dash", async () => {
      // TODO: instantiate WASM module and connect PTY slave to xterm
      await delay(180);
    });

    ln();
    ln(`${C.green}Boot complete.${C.reset}`);
    ln();

    // MOTD — fetched here so nothing downloads before the user boots
    if (motdPath) {
      try {
        const url = new URL(motdPath.replace(/^\//, ""), document.baseURI).toString();
        const res = await fetch(url);
        if (res.ok) {
          const raw = await res.text();
          const text = raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
            String.fromCharCode(parseInt(h, 16))
          );
          ln(text.trim());
          ln();
        }
      } catch (e) {
        console.error("MOTD load failed:", e);
      }
    }

    // TODO: replace runPrompt() with the real PTY shell once WASM is wired up.
    setTitle("dash (wasm)");
    await runPrompt(term, motdPath);

  } catch (err) {
    console.error("[boot]", err);
    ln();
    ln(`${C.red}Boot failed.${C.reset} See console for details.`);
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
