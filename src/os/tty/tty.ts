// tty — the terminal device and its line discipline.
//
//   xterm.js   = the hardware terminal (draws characters, emits keystrokes)
//   local-echo = the line discipline (canonical mode: echo, cursor keys,
//                history, Ctrl-C clears the line — the shell only ever sees
//                a finished line)
//
// When no one is reading a line, Ctrl-C becomes a signal to the foreground
// process instead, exactly like a real TTY sending SIGINT.

import type { Terminal } from "@xterm/xterm";
import LocalEchoController from "local-echo";

import { stripAnsi } from "../lib/ansi";

/**
 * local-echo v0.2.0 uses the result of applyPrompts() for both:
 *   1. term.write() / print() — needs the raw ANSI string
 *   2. countLines() / offsetToColRow() — need stripped length and charAt()
 *
 * AnsiAwareString satisfies both: `.length` and `.charAt()` operate on the
 * stripped text while `.replace()` and `.toString()` use the raw ANSI string.
 */
class AnsiAwareString {
  private stripped: string;
  length: number;

  constructor(private raw: string) {
    this.stripped = stripAnsi(raw);
    this.length = this.stripped.length;
  }
  charAt(i: number) {
    return this.stripped.charAt(i);
  }
  replace(re: RegExp, sub: string) {
    return this.raw.replace(re, sub);
  }
  toString() {
    return this.raw;
  }
  valueOf() {
    return this.raw;
  }
}

type LegacyTerminal = Terminal & {
  on?: (event: string, handler: (data: any) => void) => void;
  off?: (event: string, handler: (data: any) => void) => void;
};

// local-echo v0.2.0 uses the xterm v3/v4 .on()/.off() event API.
// Shim it onto the xterm v6 terminal instance before constructing.
//
// The onData wrapper buffers all term.write() calls that happen synchronously
// during a single keypress and flushes them as one atomic write, which
// prevents xterm.js from rendering the intermediate blank state that local-echo
// produces when it erases and redraws the current line.
function shimLegacyEvents(term: LegacyTerminal) {
  if (term.on) return;
  const origWrite = term.write.bind(term);
  const disposables = new Map<string, { handler: unknown; d: { dispose(): void } }[]>();
  term.on = (event, handler) => {
    let d;
    if (event === "data") {
      d = term.onData((data) => {
        let buf = "";
        term.write = ((s: string) => {
          buf += s;
        }) as Terminal["write"];
        handler(data);
        term.write = origWrite;
        if (buf) origWrite(buf);
      });
    } else if (event === "resize") {
      d = term.onResize(handler);
    } else {
      return;
    }
    if (!disposables.has(event)) disposables.set(event, []);
    disposables.get(event)!.push({ handler, d });
  };
  term.off = (event, handler) => {
    const list = disposables.get(event) || [];
    const idx = list.findIndex((e) => e.handler === handler);
    if (idx !== -1) {
      list[idx].d.dispose();
      list.splice(idx, 1);
    }
  };
}

export class Tty {
  private echo: LocalEchoController;
  /** Called on Ctrl-C while no line is being read (i.e. a program is in the foreground). */
  onInterrupt: () => void = () => {};

  constructor(private term: Terminal) {
    shimLegacyEvents(term);
    this.echo = new LocalEchoController(term);
    this.echo.applyPrompts = function (this: LocalEchoController, input: string) {
      const prompt = this._activePrompt?.prompt || "";
      const cont = this._activePrompt?.continuationPrompt || "";
      return new AnsiAwareString(prompt + input.replace(/\n/g, "\n" + cont));
    };

    term.onData((data) => {
      if (data !== "\x03" || this.echo._active) return;
      this.write("^C\n");
      this.onInterrupt();
    });
  }

  write(s: string) {
    this.term.write(s.replace(/\r?\n/g, "\r\n"));
  }

  /** Canonical-mode read: resolves with one edited line, or null if aborted. */
  async readLine(prompt: string): Promise<string | null> {
    try {
      return await this.echo.read(prompt);
    } catch {
      return null;
    }
  }

  get columns() {
    return this.term.cols;
  }

  focus() {
    this.term.focus();
  }
}
