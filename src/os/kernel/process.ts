// kernel/process — what the kernel tracks about each running program.
//
// JavaScript can't pre-empt or kill a running function, so "killing" a
// process means: resolve its exit status immediately, fire its AbortSignal so
// it can clean up, and drop anything it writes afterwards. That's close to
// how a real kernel tears down a process, minus forcibly stopping the CPU.

export type Signal = "SIGINT" | "SIGTERM";

export const SIGNAL_NUMBERS: Record<Signal, number> = { SIGINT: 2, SIGTERM: 15 };

export interface Process {
  pid: number;
  ppid: number;
  /** Path of the executable file this process was started from. */
  exe: string;
  argv: string[];
  cwd: string;
  env: Record<string, string>;
  state: "running" | "exited";
  /** Fires when the process receives a signal; programs listen to clean up. */
  signal: AbortSignal;
  exited: Promise<number>;
}

export interface ProcessControl {
  proc: Process;
  abort: AbortController;
  exit(code: number): void;
}

export function createProcess(fields: Pick<Process, "pid" | "ppid" | "exe" | "argv" | "cwd" | "env">): ProcessControl {
  const abort = new AbortController();
  let resolveExit!: (code: number) => void;
  const exited = new Promise<number>((r) => (resolveExit = r));

  const proc: Process = { ...fields, state: "running", signal: abort.signal, exited };

  return {
    proc,
    abort,
    exit(code) {
      if (proc.state === "exited") return;
      proc.state = "exited";
      resolveExit(code);
    },
  };
}

/** Thrown by sys.exit() to unwind a program's stack back to the kernel. */
export class ExitRequest {
  constructor(public code: number) {}
}
