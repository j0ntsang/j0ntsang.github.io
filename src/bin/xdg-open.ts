// xdg-open — open a URL in a new browser tab. The resume/github/linkedin/
// codepen executables are all this one module; each file passes its URL via a
// "#url:" header, the way a .desktop launcher file points at a target.

import { C } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

export default async function xdgOpen(argv: string[], sys: Sys) {
  const header = await sys.readFile(sys.exe);
  const url = argv[1] ?? header.match(/^#url:\s*(\S+)/m)?.[1];
  if (!url) {
    sys.error("usage: xdg-open <url>\n");
    return 1;
  }
  sys.write(`${C.dim}Opening ${url}…${C.reset}\n`);
  sys.openUrl(url);
}

