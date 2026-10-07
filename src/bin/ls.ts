// /bin/ls — list directory contents.

import { C } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

export default async function ls(argv: string[], sys: Sys) {
  const targets = argv.slice(1).length ? argv.slice(1) : ["."];
  let status = 0;

  for (const target of targets) {
    const st = await sys.stat(target);
    if (!st) {
      sys.error(`ls: ${target}: No such file or directory\n`);
      status = 1;
      continue;
    }
    if (targets.length > 1) sys.write(`${target}:\n`);
    if (st.type === "file") {
      sys.write(`${target}\n`);
      continue;
    }

    const base = sys.resolve(target);
    const names = await sys.readdir(target);
    const entries = await Promise.all(
      names.map(async (name) => {
        const child = await sys.stat(base === "/" ? `/${name}` : `${base}/${name}`);
        return child?.type === "dir" ? `${C.blue}${C.bold}${name}/${C.reset}` : name;
      }),
    );
    if (entries.length) sys.write(entries.join("  ") + "\n");
  }
  return status;
}
