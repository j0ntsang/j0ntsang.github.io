import type { Signal } from "../os/kernel/process";
import type { Sys } from "../os/kernel/syscalls";

const USAGE = "usage: kill [-INT|-TERM] <pid>...\n";

const SIGNALS: Record<string, Signal> = {
  INT: "SIGINT", SIGINT: "SIGINT", "2": "SIGINT",
  TERM: "SIGTERM", SIGTERM: "SIGTERM", "15": "SIGTERM",
};

export default async function kill(argv: string[], sys: Sys) {
  let args = argv.slice(1);
  let sig: Signal = "SIGTERM";
  if (args[0]?.startsWith("-")) {
    const named = SIGNALS[args[0].slice(1).toUpperCase()];
    if (!named) {
      sys.error(`kill: ${args[0].slice(1)}: invalid signal\n${USAGE}`);
      return 2;
    }
    sig = named;
    args = args.slice(1);
  }
  if (!args.length) {
    sys.error(USAGE);
    return 2;
  }

  let status = 0;
  for (const arg of args) {
    if (!/^\d+$/.test(arg) || !sys.kill(Number(arg), sig)) {
      sys.error(`kill: (${arg}) - No such process\n`);
      status = 1;
    }
  }
  return status;
}
