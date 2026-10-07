// /bin/rm — remove files. On an overlay mount, removing a file you changed
// reveals the shipped original again.

import type { Sys } from "../os/kernel/syscalls";

export default async function rm(argv: string[], sys: Sys) {
  if (argv.length < 2) {
    sys.error("usage: rm <file>...\n");
    return 1;
  }
  let status = 0;
  for (const path of argv.slice(1)) {
    try {
      await sys.unlink(path);
    } catch (err) {
      sys.error(`rm: ${(err as Error).message}\n`);
      status = 1;
    }
  }
  return status;
}
