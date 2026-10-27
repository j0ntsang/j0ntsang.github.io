import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { overlayfs } from "../overlayfs";
import { FsError } from "../types";
import { fakeLower, FakeStorage } from "./fakes";

const SHIPPED = { "/guest/october/README": "shipped\n", "/guest/other.txt": "o" };
const README = "/guest/october/README";

let storage: FakeStorage;
/** (Re)start the overlay on the current storage, like a page reload. */
const boot = () => overlayfs(fakeLower(SHIPPED), "/home");
const code = (p: Promise<unknown>) => p.then(() => "ok", (e: FsError) => e.code);

beforeEach(() => {
  storage = new FakeStorage();
  vi.stubGlobal("localStorage", storage);
});
afterEach(() => vi.unstubAllGlobals());

describe("overlayfs", () => {
  it("reads shipped files and copies up on first write", async () => {
    const fs = boot();
    expect(await fs.readFile(README)).toBe("shipped\n");
    await fs.writeFile(README, "mine");
    expect(await fs.readFile(README)).toBe("mine");
    expect(storage.getItem("fs:/home" + README)).toBe("mine");
    expect(await fs.stat(README)).toEqual({ type: "file", size: 4 });
  });

  it("rm on a changed shipped file reveals the shipped copy", async () => {
    const fs = boot();
    await fs.writeFile(README, "mine");
    await fs.unlink(README);
    expect(await fs.readFile(README)).toBe("shipped\n");
    expect(storage.getItem("fs:/home" + README)).toBeNull();
  });

  it("rm on an unchanged shipped file hides it, and the hiding survives a reload", async () => {
    const fs = boot();
    await fs.unlink(README);
    expect(await fs.stat(README)).toBeNull();
    expect(await fs.readdir("/guest/october")).toEqual([]);
    expect(await code(fs.readFile(README))).toBe("ENOENT");
    expect(await code(fs.unlink(README))).toBe("ENOENT");

    const reloaded = boot();
    expect(await reloaded.stat(README)).toBeNull();
    expect(await reloaded.readdir("/guest/october")).toEqual([]);
  });

  it("writing to a hidden file un-hides it", async () => {
    await boot().unlink(README);
    const fs = boot();
    await fs.writeFile(README, "again");
    expect(await fs.readFile(README)).toBe("again");
    expect(await fs.readdir("/guest/october")).toEqual(["README"]);
  });

  it("implies directories from files written under them", async () => {
    const fs = boot();
    await fs.writeFile("/guest/notes/a.txt", "x");
    expect(await fs.stat("/guest/notes")).toEqual({ type: "dir", size: 0 });
    expect(await fs.readdir("/guest")).toEqual(["notes", "october", "other.txt"]);
    expect(await fs.stat("/")).toEqual({ type: "dir", size: 0 });
  });

  it("refuses to unlink directories and missing paths", async () => {
    const fs = boot();
    expect(await code(fs.unlink("/guest/october"))).toBe("EISDIR");
    expect(await code(fs.unlink("/guest/nothere"))).toBe("ENOENT");
  });

  it("reports ENOSPC on a quota failure but keeps the value readable this session", async () => {
    const fs = boot();
    const file = "/guest/october/2026.json";
    await fs.writeFile(file, '{"v":1}');
    storage.quota = 0;
    await expect(fs.writeFile(file, '{"v":2}')).rejects.toThrow(`${file}: No space left on device`);
    expect(await fs.readFile(file)).toBe('{"v":2}');
    expect(storage.getItem("fs:/home" + file)).toBe('{"v":1}');
    expect(await boot().readFile(file)).toBe('{"v":1}');
  });

  it("hides a file for the session when its whiteout can't be saved", async () => {
    const fs = boot();
    storage.quota = 0;
    expect(await code(fs.unlink(README))).toBe("ENOSPC");
    expect(await fs.stat(README)).toBeNull();
    expect(await boot().readFile(README)).toBe("shipped\n");
  });

  it("works from memory when storage is fully blocked", async () => {
    storage.blocked = true;
    const fs = boot();
    expect(await fs.readFile(README)).toBe("shipped\n");
    expect(await code(fs.writeFile("/guest/x", "x"))).toBe("ENOSPC");
    expect(await fs.readFile("/guest/x")).toBe("x");
    expect(await fs.readdir("/guest")).toEqual(["october", "other.txt", "x"]);
    await fs.unlink("/guest/x");
    expect(await fs.stat("/guest/x")).toBeNull();
  });
});
