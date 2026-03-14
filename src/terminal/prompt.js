// prompt.js — interactive prompt loop using local-echo for line editing.
// Replace runPrompt() with the real PTY shell once the WASM binary is wired up.

import LocalEchoController from "local-echo";

const C = {
  reset:  "\x1b[0m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  dim:    "\x1b[2m",
};

const PROMPT = `${C.green}guest${C.reset}@${C.cyan}j0ntsang${C.reset}:${C.yellow}~${C.reset}$ `;

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1b\][^\x07]*\x07/g, "");

/**
 * local-echo v0.2.0 uses the result of applyPrompts() for both:
 *   1. term.write() / print() — needs the raw ANSI string
 *   2. countLines() / offsetToColRow() — need stripped length and charAt()
 *
 * AnsiAwareString satisfies both: `.length` and `.charAt()` operate on the
 * stripped text while `.replace()` and `.toString()` use the raw ANSI string.
 */
class AnsiAwareString {
  constructor(raw) {
    this._raw = raw;
    this._stripped = stripAnsi(raw);
    this.length = this._stripped.length;
  }
  charAt(i) { return this._stripped.charAt(i); }
  replace(re, sub) { return this._raw.replace(re, sub); }
  toString() { return this._raw; }
  valueOf() { return this._raw; }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const setTitle = (term, t) => term.write(`\x1b]0;${t}\x07`);

const COMMANDS = {
  help(term) {
    const pad = (s, n) => s + " ".repeat(Math.max(1, n - s.length));
    const cmds = [
      ["help",     "Show this help message"],
      ["about",    "Print bio / MOTD"],
      ["resume",   "Open resume PDF"],
      ["github",   "Open GitHub profile"],
      ["linkedin", "Open LinkedIn profile"],
      ["codepen",  "Open CodePen profile"],
      ["clear",    "Clear the screen"],
    ];
    for (const [name, desc] of cmds) {
      term.write(`  ${C.cyan}${pad(name, 12)}${C.reset}${C.dim}${desc}${C.reset}\r\n`);
    }
  },

  about(term, motdPath) {
    if (!motdPath) { term.write("(no MOTD configured)\r\n"); return; }
    return fetch(new URL(motdPath.replace(/^\//, ""), document.baseURI).toString())
      .then(res => res.ok ? res.text() : Promise.reject())
      .then(raw => {
        const text = raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) =>
          String.fromCharCode(parseInt(h, 16))
        );
        term.write(text.trim() + "\r\n");
      })
      .catch(() => term.write("(could not load MOTD)\r\n"));
  },

  resume(term) {
    term.write(`${C.dim}Opening resume…${C.reset}\r\n`);
    window.open("/resume.pdf", "_blank");
  },

  github(term) {
    term.write(`${C.dim}Opening GitHub…${C.reset}\r\n`);
    window.open("https://www.github.com/j0ntsang", "_blank");
  },

  linkedin(term) {
    term.write(`${C.dim}Opening LinkedIn…${C.reset}\r\n`);
    window.open("https://www.linkedin.com/in/j0ntsang", "_blank");
  },

  codepen(term) {
    term.write(`${C.dim}Opening CodePen…${C.reset}\r\n`);
    window.open("https://codepen.io/tsang", "_blank");
  },

  clear(term, _motdPath, echo) {
    term.clear();
    echo.print("");
  },
};

// ---------------------------------------------------------------------------
// Main prompt loop
// ---------------------------------------------------------------------------

/**
 * Start the interactive prompt loop.
 * @param {import("@xterm/xterm").Terminal} term
 * @param {string} [motdPath]
 */
// local-echo v0.2.0 uses the xterm v3/v4 .on()/.off() event API.
// Shim it onto the xterm v6 terminal instance before constructing.
//
// The onData wrapper buffers all term.write() calls that happen synchronously
// during a single keypress and flushes them as one atomic write, which
// prevents xterm.js from rendering the intermediate blank state that local-echo
// produces when it erases and redraws the current line.
function shimLegacyEvents(term) {
  if (term.on) return; // already shimmed or native
  const origWrite = term.write.bind(term);
  const disposables = new Map();
  term.on = (event, handler) => {
    let d;
    if (event === "data") {
      const buffered = (data) => {
        let buf = "";
        term.write = (s) => { buf += s; };
        handler(data);
        term.write = origWrite;
        if (buf) origWrite(buf);
      };
      d = term.onData(buffered);
    } else if (event === "resize") {
      d = term.onResize(handler);
    } else {
      return;
    }
    if (!disposables.has(event)) disposables.set(event, []);
    disposables.get(event).push({ handler, d });
  };
  term.off = (event, handler) => {
    const list = disposables.get(event) || [];
    const idx = list.findIndex((e) => e.handler === handler);
    if (idx !== -1) { list[idx].d.dispose(); list.splice(idx, 1); }
  };
}

export async function runPrompt(term, motdPath) {
  shimLegacyEvents(term);
  const echo = new LocalEchoController(term);

  // Patch applyPrompts to return an AnsiAwareString so that:
  //   - print() / term.write() get the full ANSI-colored string
  //   - countLines() / offsetToColRow() see stripped length and chars
  echo.applyPrompts = function(input) {
    const prompt = (this._activePrompt || {}).prompt || "";
    const cont   = (this._activePrompt || {}).continuationPrompt || "";
    return new AnsiAwareString(prompt + input.replace(/\n/g, "\n" + cont));
  };

  while (true) {
    let line;
    try {
      line = await echo.read(PROMPT);
    } catch {
      // Ctrl-C / Ctrl-D from local-echo
      continue;
    }

    const input = line.trim();
    if (!input) continue;

    const [cmd, ...args] = input.split(/\s+/);

    if (cmd in COMMANDS) {
      setTitle(term, cmd);
      await COMMANDS[cmd](term, motdPath, echo, args);
      setTitle(term, "dash (wasm)");
    } else {
      term.write(`${C.dim}${cmd}: command not found — type ${C.reset}help${C.dim} for available commands${C.reset}\r\n`);
    }
  }
}
