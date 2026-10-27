import { childrenOf, FsDriver, FsError } from "../types";

/** A localStorage stand-in with a settable quota and a blocked mode (every call throws). */
export class FakeStorage {
  private items = new Map<string, string>();
  blocked = false;
  quota = Infinity;

  private guard() {
    if (this.blocked) throw new DOMException("blocked", "SecurityError");
  }

  get length() {
    this.guard();
    return this.items.size;
  }

  key(i: number) {
    return Array.from(this.items.keys())[i] ?? null;
  }

  getItem(k: string) {
    this.guard();
    return this.items.get(k) ?? null;
  }

  setItem(k: string, v: string) {
    this.guard();
    let used = 0;
    this.items.forEach((value, key) => {
      if (key !== k) used += key.length + value.length;
    });
    if (used + k.length + v.length > this.quota) throw new DOMException("quota", "QuotaExceededError");
    this.items.set(k, String(v));
  }

  removeItem(k: string) {
    this.guard();
    this.items.delete(k);
  }
}

/** A read-only lower driver over a flat file map, like the shipped rootfs. */
export function fakeLower(files: Record<string, string>): FsDriver {
  const paths = Object.keys(files);
  const ro = async (path: string): Promise<never> => {
    throw new FsError("EROFS", path);
  };
  return {
    name: "fake",
    async stat(path) {
      if (path in files) return { type: "file", size: files[path].length };
      return path === "/" || paths.some((p) => p.startsWith(path + "/")) ? { type: "dir", size: 0 } : null;
    },
    async readFile(path) {
      if (path in files) return files[path];
      const isDir = path === "/" || paths.some((p) => p.startsWith(path + "/"));
      throw new FsError(isDir ? "EISDIR" : "ENOENT", path);
    },
    async readdir(path) {
      const kids = childrenOf(path, paths);
      if (!kids.length && path !== "/") throw new FsError("ENOENT", path);
      return kids;
    },
    writeFile: ro,
    unlink: ro,
  };
}
