// /usr/bin/about — print the bio (/etc/motd).

import { unescapeAnsi } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

export default async function about(_argv: string[], sys: Sys) {
  sys.write(unescapeAnsi(await sys.readFile("/etc/motd")).trim() + "\n");
}
