// lib/ansi — the "libc" escape-code helpers that user-space programs share.

export const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  strike: "\x1b[9m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

export const stripAnsi = (s: string) =>
  s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").replace(/\x1b\][^\x07]*\x07/g, "");

/** OSC 8 hyperlink — clickable in xterm via its linkHandler. */
export const link = (url: string, text: string) =>
  `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`;

/** OSC 0 — sets the window title (forwarded to the page by the terminal). */
export const title = (t: string) => `\x1b]0;${t}\x07`;

/** Text files in rootfs store escapes literally ("\x1b") so they stay diffable in git. */
export const unescapeAnsi = (raw: string) =>
  raw.replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

export const pad = (s: string, n: number) => s + " ".repeat(Math.max(1, n - stripAnsi(s).length));
