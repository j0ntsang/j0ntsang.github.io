// /sbin/init — PID 1. Prints the motd, then keeps a shell
// running forever: if you `exit` the shell, init starts a fresh one.
//
// A shell that dies the moment it starts (say its chunk failed to load) would
// be respawned in a tight loop, so, like sysvinit, init calls that
// "respawning too fast" and waits a while before trying again.

import { unescapeAnsi } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

/** A shell that exits this soon never really started. */
const QUICK_EXIT_MS = 1000;
const MAX_QUICK_EXITS = 5;
const DISABLED_MINUTES = 5;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function init(_argv: string[], sys: Sys) {
  sys.write("\x1b[2J\x1b[H");
  try {
    sys.write(unescapeAnsi(await sys.readFile("/etc/motd")).trim() + "\n\n");
  } catch {
    // No motd is fine.
  }

  let quickExits = 0;
  for (;;) {
    const started = Date.now();
    await sys.spawn("/bin/sh", ["sh"], { foreground: true });
    sys.write("\n");

    quickExits = Date.now() - started < QUICK_EXIT_MS ? quickExits + 1 : 0;
    if (quickExits >= MAX_QUICK_EXITS) {
      sys.error(`init: Id "sh" respawning too fast: disabled for ${DISABLED_MINUTES} minutes\n`);
      await sleep(DISABLED_MINUTES * 60_000);
    }
  }
}
