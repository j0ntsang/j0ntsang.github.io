// /bin/ps — list processes, by reading /proc like the real one does.

import { pad } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

export default async function ps(_argv: string[], sys: Sys) {
  sys.write(`${pad("PID", 6)}${pad("PPID", 6)}CMD\n`);
  for (const pid of await sys.readdir("/proc")) {
    const status = await sys.readFile(`/proc/${pid}/status`);
    const cmdline = await sys.readFile(`/proc/${pid}/cmdline`);
    const ppid = status.match(/^PPid:\t(\d+)/m)?.[1] ?? "?";
    sys.write(`${pad(pid, 6)}${pad(ppid, 6)}${cmdline.split("\0").join(" ")}\n`);
  }
}
