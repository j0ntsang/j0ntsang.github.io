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

/** The upper layer's backing store; falls back to memory if localStorage is unavailable. */
class Store {
  private memory = new Map<string, string>();
  private persistent = true;

  constructor(private prefix: string) {
    try {
      localStorage.getItem(prefix);
    } catch {
      this.persistent = false;
    }
  }

  get(key: string): string | null {
    if (!this.persistent) return this.memory.get(key) ?? null;
    try {
      return localStorage.getItem(this.prefix + key);
    } catch {
      return this.memory.get(key) ?? null;
    }
  }

  set(key: string, value: string) {
    this.memory.set(key, value);
    if (!this.persistent) return;
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch {
      // Quota or privacy mode: the write lives in memory for this session.
    }
  }

  delete(key: string) {
    this.memory.delete(key);
    if (!this.persistent) return;
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      // Ignore; memory copy is already gone.
    }
  }

  keys(): string[] {
    const keys = new Set(this.memory.keys());
    if (this.persistent) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(this.prefix)) keys.add(k.slice(this.prefix.length));
        }
      } catch {
        // Memory keys are still valid.
      }
    }
    return Array.from(keys);
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
