// /bin/pwd — print the working directory.

import type { Sys } from "../os/kernel/syscalls";

export default function pwd(_argv: string[], sys: Sys) {
  sys.write(sys.cwd() + "\n");
}
