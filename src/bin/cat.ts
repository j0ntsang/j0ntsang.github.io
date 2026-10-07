// /bin/cat — print files.

import type { Sys } from "../os/kernel/syscalls";

export default async function cat(argv: string[], sys: Sys) {
  let status = 0;
  for (const path of argv.slice(1)) {
    try {
      const text = await sys.readFile(path);
      sys.write(text.endsWith("\n") ? text : text + "\n");
    } catch (err) {
      sys.error(`cat: ${(err as Error).message}\n`);
      status = 1;
    }
  }
  return status;
}
