// /bin/sh — the shell is just another program.
//
// Its whole job: read a line, find the executable on $PATH, spawn it in the
// foreground, wait for its exit code, repeat. Only `cd` and `exit` are
// built in, because they change the shell's own process state.

import { tildify } from "../os/fs/path";
import { C, title } from "../os/lib/ansi";
import type { Completer, Sys } from "../os/kernel/syscalls";

const BUILTINS = ["cd", "exit"];

/** Split on whitespace, honouring "double" and 'single' quotes. */
function tokenize(line: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(line))) tokens.push(m[1] ?? m[2] ?? m[3]);
  return tokens;
}

async function which(cmd: string, sys: Sys): Promise<string | null> {
  const candidates = cmd.includes("/")
    ? [cmd]
    : sys.env.PATH.split(":").map((dir) => `${dir}/${cmd}`);
  for (const path of candidates) {
    if ((await sys.stat(path))?.type === "file") return sys.resolve(path);
  }
  return null;
}

/** Tab completion: commands for the first word, paths after that (`cd` gets directories only). */
function completer(sys: Sys): Completer {
  return async (before) => {
    const words = before.split(/\s+/);
    const word = words[words.length - 1];

    if (words.length === 1 && !word.includes("/")) {
      const dirs = sys.env.PATH.split(":");
      const listings = await Promise.all(dirs.map((dir) => sys.readdir(dir).catch(() => [])));
      return [...BUILTINS, ...listings.flat()];
    }

    const dir = word.slice(0, word.lastIndexOf("/") + 1);
    const names = await sys.readdir(dir || ".").catch(() => [] as string[]);
    const matches = await Promise.all(
      names
        .filter((name) => name.startsWith(word.slice(dir.length)))
        .map(async (name) => {
          const isDir = (await sys.stat(dir + name))?.type === "dir";
          return isDir ? `${dir}${name}/` : `${dir}${name}`;
        }),
    );
    return words[0] === "cd" ? matches.filter((m) => m.endsWith("/")) : matches;
  };
}

export default async function sh(_argv: string[], sys: Sys) {
  let status = 0;
  const complete = completer(sys);

  for (;;) {
    const cwd = tildify(sys.cwd(), sys.env.HOME);
    sys.write(title(`${sys.env.USER}@${sys.env.HOSTNAME}: ${cwd}`));
    const code = status ? `${C.red}[${status}]${C.reset} ` : "";
    const prompt = `${code}${C.green}${sys.env.USER}${C.reset}@${C.cyan}${sys.env.HOSTNAME}${C.reset}:${C.yellow}${cwd}${C.reset}$ `;

    const line = await sys.readLine(prompt, complete);
    if (line === null) continue;
    const [cmd, ...args] = tokenize(line);
    if (!cmd) continue;

    if (cmd === "exit") return Number(args[0]) || 0;
    if (cmd === "cd") {
      try {
        await sys.chdir(args[0] ?? "~");
        status = 0;
      } catch (err) {
        sys.error(`cd: ${(err as Error).message}\n`);
        status = 1;
      }
      continue;
    }

    const path = await which(cmd, sys);
    if (!path) {
      sys.error(`sh: ${cmd}: not found ${C.dim}— type ${C.reset}help${C.dim} for available commands${C.reset}\n`);
      status = 127;
      continue;
    }

    sys.write(title(cmd));
    status = await sys.spawn(path, [cmd, ...args], { foreground: true });
  }
}
