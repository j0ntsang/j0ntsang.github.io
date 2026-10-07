// fs/types — the contract every filesystem driver implements.
//
// Like Linux's VFS, the kernel never knows *how* a filesystem stores data.
// It resolves a path to a mount, strips the mount prefix, and calls the
// driver with a path relative to that mount's root (always starting with "/").
//
// Directories are implied by the files inside them (like a tar listing or an
// S3 bucket), so there is no mkdir: writing /a/b/c creates /a and /a/b.

export type FileType = "file" | "dir";

export interface Stat {
  type: FileType;
  size: number;
  /** Overlay mounts only: the file lives in the writable layer (changed or created locally). */
  upper?: boolean;
}

export interface FsDriver {
  readonly name: string;
  stat(path: string): Promise<Stat | null>;
  readFile(path: string): Promise<string>;
  readdir(path: string): Promise<string[]>;
  writeFile(path: string, data: string): Promise<void>;
  unlink(path: string): Promise<void>;
}

export type FsErrorCode = "ENOENT" | "EISDIR" | "ENOTDIR" | "EROFS" | "ENOEXEC";

const MESSAGES: Record<FsErrorCode, string> = {
  ENOENT: "No such file or directory",
  EISDIR: "Is a directory",
  ENOTDIR: "Not a directory",
  EROFS: "Read-only file system",
  ENOEXEC: "Exec format error",
};

export class FsError extends Error {
  constructor(public code: FsErrorCode, public path: string) {
    super(`${path}: ${MESSAGES[code]}`);
  }
}

/** Direct children of `dir` given a flat list of file paths. */
export function childrenOf(dir: string, paths: Iterable<string>): string[] {
  const prefix = dir === "/" ? "/" : dir + "/";
  const names = new Set<string>();
  for (const p of Array.from(paths)) {
    if (!p.startsWith(prefix)) continue;
    names.add(p.slice(prefix.length).split("/")[0]);
  }
  return Array.from(names).sort();
}
