// /bin/clear — erase the screen and scrollback with escape codes (no special API).

import type { Sys } from "../os/kernel/syscalls";

export default function clear(_argv: string[], sys: Sys) {
  sys.write("\x1b[H\x1b[2J\x1b[3J");
}
