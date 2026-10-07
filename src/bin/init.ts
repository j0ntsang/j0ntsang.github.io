// /sbin/init — PID 1. Prints the message of the day, then keeps a shell
// running forever: if you `exit` the shell, init starts a fresh one.

import { unescapeAnsi } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

export default async function init(_argv: string[], sys: Sys) {
  sys.write("\x1b[2J\x1b[H");
  try {
    sys.write(unescapeAnsi(await sys.readFile("/etc/motd")).trim() + "\n\n");
  } catch {
    // No motd is fine.
  }

  for (;;) {
    await sys.spawn("/bin/sh", ["sh"], { foreground: true });
    sys.write("\n");
  }
}
