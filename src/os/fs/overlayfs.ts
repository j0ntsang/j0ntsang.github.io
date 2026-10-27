// fs/overlayfs — a writable layer stacked on a read-only one.
//
// This is the same trick Docker images and live-CDs use (Linux "overlayfs"):
//   lower = read-only files shipped in the build (rootfs)
//   upper = this visitor's changes, kept in localStorage
// Reads check upper first, then lower. The first write to a shipped file
// "copies it up" into the upper layer; the lower copy is never touched.
//
// Deleting differs slightly from Linux on purpose:
//   - rm on a file you changed drops your copy, revealing the shipped one
//     again (so `rm` doubles as "revert to default");
//   - rm on an unchanged shipped file records a "whiteout" that hides it.

import { childrenOf, FsDriver, FsError } from "./types";

/**
 * The upper layer. The Map is the only state: it's filled from localStorage
 * once, and every change is written through so it survives a reload.
 */
class Store {
  private files = new Map<string, string>();

  constructor(private prefix: string) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(prefix)) this.files.set(k.slice(prefix.length), localStorage.getItem(k)!);
      }
    } catch {
      // Storage is blocked (privacy settings): start empty.
    }
  }

  get(key: string): string | null {
    return this.files.get(key) ?? null;
  }

  /** Throws ENOSPC if localStorage refused the write; the value still reads back until reload. */
  set(key: string, value: string) {
    this.files.set(key, value);
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch {
      // Over quota, or storage is blocked.
      throw new FsError("ENOSPC", key);
    }
  }

  delete(key: string) {
    this.files.delete(key);
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      // Storage is blocked, so nothing was persisted to remove.
    }
  }

  keys(): string[] {
    return Array.from(this.files.keys());
  }
}

const WHITEOUT = "\0whiteout";

export function overlayfs(lower: FsDriver, mountPoint: string): FsDriver {
  const upper = new Store(`fs:${mountPoint}`);
  const upperFiles = () => upper.keys().filter((k) => upper.get(k) !== WHITEOUT);
  const whiteouts = () => new Set(upper.keys().filter((k) => upper.get(k) === WHITEOUT));

  return {
    name: "overlay",

    async stat(path) {
      const own = upper.get(path);
      if (own === WHITEOUT) return null;
      if (own !== null) return { type: "file", size: own.length };
      if (path === "/" || upperFiles().some((k) => k.startsWith(path + "/"))) {
        return { type: "dir", size: 0 };
      }
      return lower.stat(path);
    },

    async readFile(path) {
      const own = upper.get(path);
      if (own === WHITEOUT) throw new FsError("ENOENT", path);
      if (own !== null) return own;
      return lower.readFile(path);
    },

    async readdir(path) {
      const hidden = whiteouts();
      const fromLower = (await lower.readdir(path).catch(() => [])).filter(
        (name) => !hidden.has(path === "/" ? `/${name}` : `${path}/${name}`),
      );
      return Array.from(new Set([...fromLower, ...childrenOf(path, upperFiles())])).sort();
    },

    async writeFile(path, data) {
      upper.set(path, data);
    },

    async unlink(path) {
      const own = upper.get(path);
      if (own !== null && own !== WHITEOUT) {
        upper.delete(path);
        return;
      }
      const shipped = await lower.stat(path);
      if (!shipped || own === WHITEOUT) throw new FsError("ENOENT", path);
      if (shipped.type === "dir") throw new FsError("EISDIR", path);
      upper.set(path, WHITEOUT);
    },
  };
}
