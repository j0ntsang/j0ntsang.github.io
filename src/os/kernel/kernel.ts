// kernel — owns the process table and turns files into running programs.
//
// exec, in this OS: an executable is a text file in the VFS whose first line
// is "#!module:<name>" (our ELF header). The kernel reads it, finds the
// matching module in src/bin/, lazy-loads that chunk, and calls its default
// export with (argv, sys).

import type { Compositor } from "../display/compositor";
import { resolvePath } from "../fs/path";
import { FsError } from "../fs/types";
import type { Vfs } from "../fs/vfs";
import type { Tty } from "../tty/tty";
import { createProcess, ExitRequest, Process, ProcessControl, Signal, SIGNAL_NUMBERS } from "./process";
import type { Program, SpawnOptions, Sys } from "./syscalls";

const binaries = import.meta.glob("../../bin/*.{ts,tsx}") as Record<string, () => Promise<{ default: Program }>>;

const findBinary = (name: string) =>
  binaries[`../../bin/${name}.ts`] ?? binaries[`../../bin/${name}.tsx`];

export class Kernel {
  private table = new Map<number, ProcessControl>();
  private nextPid = 1;
  private foreground: Process | null = null;

  constructor(private vfs: Vfs, private tty: Tty, private display: Compositor) {
    tty.onInterrupt = () => this.foreground && this.kill(this.foreground.pid, "SIGINT");
    display.onInterrupt = (pid) => this.kill(pid, "SIGINT");
    display.onEmpty = () => tty.focus();
  }

  processes(): Process[] {
    return Array.from(this.table.values()).map((c) => c.proc);
  }

  kill(pid: number, sig: Signal) {
    const ctl = this.table.get(pid);
    if (!ctl) return false;
    if (pid === 1) return true;
    ctl.abort.abort(sig);
    ctl.exit(128 + SIGNAL_NUMBERS[sig]);
    return true;
  }

  /** fork + exec in one step. Resolves to the exit code. */
  async spawn(
    path: string,
    argv: string[],
    parent: Pick<Process, "pid" | "cwd" | "env"> | null,
    opts: SpawnOptions = {},
  ): Promise<number> {
    const env = parent?.env ?? {
      PATH: "/usr/bin:/bin:/sbin",
      HOME: "/home/guest",
      USER: "guest",
      HOSTNAME: window.location.hostname || "localhost",
    };
    const ctl = createProcess({
      pid: this.nextPid++,
      ppid: opts.daemon ? 1 : (parent?.pid ?? 0),
      exe: path,
      argv,
      cwd: parent?.cwd ?? env.HOME,
      env: { ...env },
    });
    const { proc } = ctl;
    this.table.set(proc.pid, ctl);

    const previousForeground = this.foreground;
    if (opts.foreground) this.foreground = proc;

    this.run(ctl);
    const code = await proc.exited;

    this.table.delete(proc.pid);
    this.display.closeAll(proc.pid);
    if (opts.foreground) this.foreground = previousForeground;
    return code;
  }

  private async run(ctl: ProcessControl) {
    const { proc } = ctl;
    try {
      const main = await this.load(proc.exe);
      const code = await main(proc.argv, this.syscalls(ctl));
      ctl.exit(typeof code === "number" ? code : 0);
    } catch (err) {
      if (err instanceof ExitRequest) return ctl.exit(err.code);
      if (proc.state === "running") {
        this.tty.write(`${proc.argv[0]}: ${err instanceof Error ? err.message : err}\n`);
        console.error(`[pid ${proc.pid}]`, err);
      }
      ctl.exit(err instanceof FsError && err.code === "ENOEXEC" ? 126 : 1);
    }
  }

  private async load(path: string): Promise<Program> {
    const header = (await this.vfs.readFile(path)).split("\n")[0];
    const name = header.match(/^#!module:(\S+)/)?.[1];
    const loader = name && findBinary(name);
    if (!loader) throw new FsError("ENOEXEC", path);
    return (await loader()).default;
  }

  private syscalls(ctl: ProcessControl): Sys {
    const { proc } = ctl;
    const alive = () => proc.state === "running";
    const abs = (p: string) => resolvePath(p, proc.cwd, proc.env.HOME);
    const { vfs, tty } = this;

    return {
      pid: proc.pid,
      exe: proc.exe,
      env: proc.env,
      signal: proc.signal,

      exit: (code = 0) => {
        throw new ExitRequest(code);
      },
      spawn: (path, argv, opts) => this.spawn(abs(path), argv, proc, opts),
      cwd: () => proc.cwd,
      kill: (pid, sig = "SIGTERM") => this.kill(pid, sig),
      chdir: async (path) => {
        const target = abs(path);
        const st = await vfs.stat(target);
        if (!st) throw new FsError("ENOENT", path);
        if (st.type !== "dir") throw new FsError("ENOTDIR", path);
        proc.cwd = target;
      },

      resolve: abs,
      stat: (p) => vfs.stat(abs(p)),
      readFile: (p) => vfs.readFile(abs(p)),
      writeFile: (p, d) => vfs.writeFile(abs(p), d),
      readdir: (p) => vfs.readdir(abs(p)),
      unlink: (p) => vfs.unlink(abs(p)),

      write: (s) => alive() && tty.write(s),
      error: (s) => alive() && tty.write(s),
      readLine: (prompt, complete) => tty.readLine(prompt, complete),
      get columns() {
        return tty.columns;
      },

      fetch: (input, init) => fetch(input, { ...init, signal: proc.signal }),
      openUrl: (url) => {
        window.open(url, "_blank", "noopener,noreferrer");
      },
      createWindow: ({ title, ...opts }) => this.display.createWindow(proc.pid, title, opts),
      createPanel: ({ title }) => {
        const panel = this.display.createPanel(proc.pid);
        panel.setTitle(title);
        return panel;
      },
    };
  }
}
