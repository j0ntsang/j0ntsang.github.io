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

import type { Completer } from "../kernel/syscalls";
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

function commonPrefix(words: string[]): string {
  let prefix = words[0];
  for (const w of words) while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix;
}

export class Tty {
  private echo: LocalEchoController;
  private complete: Completer | null = null;
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

    // local-echo's own Tab support needs synchronous candidates and always
    // appends a space, so Tab is handled here instead, bash-style.
    const handleData = this.echo.handleData.bind(this.echo);
    this.echo.handleData = (data) => {
      if (data === "\t" && this.complete) void this.handleTab(this.complete);
      else handleData(data);
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
  async readLine(prompt: string, complete?: Completer): Promise<string | null> {
    this.complete = complete ?? null;
    try {
      return await this.echo.read(prompt);
    } catch {
      return null;
    } finally {
      this.complete = null;
    }
  }

  /**
   * One match: insert it, plus a space unless it's a directory.
   * Several: extend to their common prefix, or list them if there is none.
   */
  private async handleTab(complete: Completer) {
    const echo = this.echo;
    const { _input: input, _cursor: cursor } = echo;
    const before = input.slice(0, cursor);
    const word = before.match(/\S*$/)![0];

    const matches = Array.from(new Set(await complete(before)))
      .filter((m) => m.startsWith(word))
      .sort();

    // The user kept typing (or pressed Enter) while we were looking.
    if (!echo._active || echo._input !== input || echo._cursor !== cursor) return;
    if (matches.length === 0) return;

    if (matches.length === 1) {
      const [match] = matches;
      echo.handleCursorInsert(match.slice(word.length) + (match.endsWith("/") ? "" : " "));
      return;
    }

    const prefix = commonPrefix(matches);
    if (prefix.length > word.length) {
      echo.handleCursorInsert(prefix.slice(word.length));
      return;
    }

    // Like bash, list just the part after the last "/".
    const dirLength = word.lastIndexOf("/") + 1;
    echo.printAndRestartPrompt(() => echo.printWide(matches.map((m) => m.slice(dirLength))));
  }

  get columns() {
    return this.term.cols;
  }

  focus() {
    this.term.focus();
  }
}
