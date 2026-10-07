// kernel/syscalls — the only door between a program and the machine.
//
// Every program receives a `sys` object and nothing else: no DOM, no
// localStorage, no xterm. Files go through the VFS, output through the TTY,
// windows through the compositor. Swapping any of those out (say, IndexedDB
// for localStorage) never touches a single program — that boundary is the
// whole point of a kernel.

import type { Surface, WindowOptions } from "../display/compositor";
import type { Stat } from "../fs/types";
import type { Signal } from "./process";

export interface SpawnOptions {
  /** Give the child the terminal (Ctrl-C goes to it) until it exits. */
  foreground?: boolean;
  /** Run detached as a child of init (PID 1), like a daemon that double-forked. */
  daemon?: boolean;
}

/** Given the text left of the cursor, returns full replacements for its last word (directories end in "/"). */
export type Completer = (beforeCursor: string) => Promise<string[]>;

export interface Sys {
  readonly pid: number;
  /** Path of this program's executable (like /proc/self/exe). */
  readonly exe: string;
  readonly env: Readonly<Record<string, string>>;
  /** Fires when this process is signalled (Ctrl-C, kill). */
  readonly signal: AbortSignal;

  // process
  exit(code?: number): never;
  spawn(path: string, argv: string[], opts?: SpawnOptions): Promise<number>;
  cwd(): string;
  chdir(path: string): Promise<void>;
  /** Signal another process. Returns false if there is no such pid. */
  kill(pid: number, sig?: Signal): boolean;

  // files (paths may be relative, or start with ~)
  resolve(path: string): string;
  stat(path: string): Promise<Stat | null>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  unlink(path: string): Promise<void>;

  // stdio
  write(s: string): void;
  error(s: string): void;
  readLine(prompt: string, complete?: Completer): Promise<string | null>;
  readonly columns: number;

  // devices
  fetch(input: string, init?: RequestInit): Promise<Response>;
  openUrl(url: string): void;
  createWindow(opts: { title: string } & WindowOptions): Surface;
  /** A chrome-less surface in the sidebar, for long-running status programs. */
  createPanel(opts: { title: string }): Surface;
}

export type Program = (argv: string[], sys: Sys) => number | void | Promise<number | void>;
