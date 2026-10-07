// /sbin/init — PID 1. Prints the message of the day, starts the sysinfo
// daemon, then keeps a shell running forever: if you `exit` the shell, init
// starts a fresh one. Daemons are re-parented to init, so they keep running
// after whatever started them exits.

import { unescapeAnsi } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

export default async function init(_argv: string[], sys: Sys) {
  sys.write("\x1b[2J\x1b[H");
  try {
    sys.write(unescapeAnsi(await sys.readFile("/etc/motd")).trim() + "\n\n");
  } catch {
    // No motd is fine.
  }

  // Services that run from boot, like systemd's enabled units.
  await sys.spawn("/usr/bin/sysinfo", ["sysinfo", "start"]);

  for (;;) {
    await sys.spawn("/bin/sh", ["sh"], { foreground: true });
    sys.write("\n");
  }
}
