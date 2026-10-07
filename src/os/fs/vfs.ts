// fs/vfs — the Virtual File System switch.
//
// One namespace ("/") stitched together from several drivers via a mount
// table. A path is routed to the mount with the longest matching prefix:
//   /home/guest/x  →  overlay mounted at /home  sees  /guest/x
//   /proc/1/status →  procfs  mounted at /proc  sees  /1/status

import { FsDriver, FsError, Stat } from "./types";

interface Mount {
  path: string;
  driver: FsDriver;
}

export class Vfs {
  private mounts: Mount[] = [];

  mount(path: string, driver: FsDriver) {
    this.mounts.push({ path, driver });
    this.mounts.sort((a, b) => b.path.length - a.path.length);
  }

  mountTable(): { path: string; driver: string }[] {
    return this.mounts.map((m) => ({ path: m.path, driver: m.driver.name })).reverse();
  }

  private route(path: string): { driver: FsDriver; rel: string } {
    for (const m of this.mounts) {
      if (m.path === "/") return { driver: m.driver, rel: path };
      if (path === m.path) return { driver: m.driver, rel: "/" };
      if (path.startsWith(m.path + "/")) return { driver: m.driver, rel: path.slice(m.path.length) };
    }
    throw new FsError("ENOENT", path);
  }

  /** Mount points directly inside `dir` show up in listings even if the parent fs lacks them. */
  private mountsUnder(dir: string): string[] {
    const prefix = dir === "/" ? "/" : dir + "/";
    return this.mounts
      .map((m) => m.path)
      .filter((p) => p !== dir && p.startsWith(prefix) && !p.slice(prefix.length).includes("/"))
      .map((p) => p.slice(prefix.length));
  }

  async stat(path: string): Promise<Stat | null> {
    if (this.mounts.some((m) => m.path === path)) return { type: "dir", size: 0 };
    const { driver, rel } = this.route(path);
    return driver.stat(rel);
  }

  readFile(path: string) {
    const { driver, rel } = this.route(path);
    return driver.readFile(rel);
  }

  async readdir(path: string) {
    const { driver, rel } = this.route(path);
    const names = await driver.readdir(rel);
    return Array.from(new Set([...names, ...this.mountsUnder(path)])).sort();
  }

  writeFile(path: string, data: string) {
    const { driver, rel } = this.route(path);
    return driver.writeFile(rel, data);
  }

  unlink(path: string) {
    const { driver, rel } = this.route(path);
    return driver.unlink(rel);
  }
}
