// /bin/help — list every executable on $PATH with its #summary header.
// Nothing is hard-coded: install a file in /usr/bin and it shows up here.

import { C, pad } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

export default async function help(_argv: string[], sys: Sys) {
  sys.write(`  ${pad("cd", 12)}${C.dim}Change directory (shell builtin)${C.reset}\n`);
  sys.write(`  ${pad("exit", 12)}${C.dim}Exit the shell; init starts a new one (builtin)${C.reset}\n`);

  for (const dir of ["/usr/bin", "/bin"]) {
    for (const name of await sys.readdir(dir)) {
      const header = await sys.readFile(`${dir}/${name}`);
      const summary = header.match(/^#summary:\s*(.*)$/m)?.[1] ?? "";
      const usage = header.match(/^#usage:\s*(.*)$/m)?.[1];
      sys.write(`  ${C.cyan}${pad(name, 12)}${C.reset}${C.dim}${summary}${usage ? ` — ${usage}` : ""}${C.reset}\n`);
    }
  }
}
