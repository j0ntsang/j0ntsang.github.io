// fs/rootfs — the read-only root filesystem, i.e. the "disk image".
//
// Every file under the repo's rootfs/ folder is baked into the build by Vite.
// The file *list* is known at build time; file *contents* are lazy chunks,
// fetched the first time something reads them. GitHub Pages serves them as
// static files, which is why this layer can never be written to.

import { childrenOf, FsDriver, FsError } from "./types";

const image = import.meta.glob("/rootfs/**/*", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const files = new Map(
  Object.entries(image).map(([key, load]) => [key.slice("/rootfs".length), load]),
);

const isDir = (path: string) => {
  if (path === "/") return true;
  const prefix = path + "/";
  return Array.from(files.keys()).some((f) => f.startsWith(prefix));
};

export const rootfs: FsDriver = {
  name: "rootfs",

  async stat(path) {
    const load = files.get(path);
    if (load) return { type: "file", size: (await load()).length };
    return isDir(path) ? { type: "dir", size: 0 } : null;
  },

  async readFile(path) {
    const load = files.get(path);
    if (load) return load();
    throw new FsError(isDir(path) ? "EISDIR" : "ENOENT", path);
  },

  async readdir(path) {
    if (!isDir(path)) throw new FsError(files.has(path) ? "ENOTDIR" : "ENOENT", path);
    return childrenOf(path, files.keys());
  },

  async writeFile(path) {
    throw new FsError("EROFS", path);
  },

  async unlink(path) {
    throw new FsError("EROFS", path);
  },
};

/** Expose a subtree of a driver as its own root (/home on rootfs → / of the view). */
export function subtree(driver: FsDriver, root: string): FsDriver {
  const at = (p: string) => (p === "/" ? root : root + p);
  return {
    name: `${driver.name}:${root}`,
    stat: (p) => driver.stat(at(p)),
    readFile: (p) => driver.readFile(at(p)),
    readdir: (p) => driver.readdir(at(p)).catch(() => []),
    writeFile: (p, d) => driver.writeFile(at(p), d),
    unlink: (p) => driver.unlink(at(p)),
  };
}
