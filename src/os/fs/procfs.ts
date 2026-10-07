// fs/procfs — a filesystem with no storage at all.
//
// Every read is generated on the fly from the kernel's process table, which is
// how Linux's /proc works. `ps` is just a program that reads these files.

import type { Process } from "../kernel/process";
import { FsDriver, FsError } from "./types";

export function procfs(processes: () => Process[]): FsDriver {
  const find = (pid: string) => processes().find((p) => String(p.pid) === pid);

  const files: Record<string, (p: Process) => string> = {
    cmdline: (p) => p.argv.join("\0"),
    cwd: (p) => p.cwd,
    status: (p) =>
      [`Name:\t${p.argv[0]}`, `State:\t${p.state === "running" ? "R (running)" : "Z (zombie)"}`, `Pid:\t${p.pid}`, `PPid:\t${p.ppid}`, ""].join("\n"),
  };

  const parse = (path: string) => {
    const [, pid, file] = path.split("/");
    return { proc: pid ? find(pid) : undefined, pid, file };
  };

  const readonly = async (path: string): Promise<never> => {
    throw new FsError("EROFS", path);
  };

  return {
    name: "proc",

    async stat(path) {
      if (path === "/") return { type: "dir", size: 0 };
      const { proc, file } = parse(path);
      if (!proc) return null;
      if (!file) return { type: "dir", size: 0 };
      return file in files ? { type: "file", size: files[file](proc).length } : null;
    },

    async readFile(path) {
      const { proc, file } = parse(path);
      if (!proc || !file || !(file in files)) throw new FsError(proc && !file ? "EISDIR" : "ENOENT", path);
      return files[file](proc);
    },

    async readdir(path) {
      if (path === "/") return processes().map((p) => String(p.pid));
      const { proc, file } = parse(path);
      if (!proc || file) throw new FsError("ENOENT", path);
      return Object.keys(files);
    },

    writeFile: readonly,
    unlink: readonly,
  };
}
