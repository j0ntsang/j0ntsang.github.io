import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Process } from "../../kernel/process";
import { overlayfs } from "../overlayfs";
import { procfs } from "../procfs";
import { Vfs } from "../vfs";
import { fakeLower, FakeStorage } from "./fakes";

const init = { pid: 1, ppid: 0, argv: ["init"], cwd: "/", state: "running" } as unknown as Process;

function makeVfs() {
  const root = fakeLower({ "/etc/motd": "hi\n", "/homework/a.txt": "a", "/home/guest/october/README": "shipped\n" });
  const vfs = new Vfs();
  vfs.mount("/", root);
  vfs.mount("/home", overlayfs(fakeLower({ "/guest/october/README": "shipped\n" }), "/home"));
  vfs.mount("/proc", procfs(() => [init]));
  return vfs;
}

/** The message a rejected call carries, or "resolved". */
const msg = (p: Promise<unknown>) => p.then(() => "resolved", (e: Error) => e.message);

beforeEach(() => vi.stubGlobal("localStorage", new FakeStorage()));
afterEach(() => vi.unstubAllGlobals());

describe("Vfs routing", () => {
  it("does not route /homework to the /home mount", async () => {
    const vfs = makeVfs();
    expect(await vfs.readFile("/homework/a.txt")).toBe("a");
    expect(await vfs.readFile("/home/guest/october/README")).toBe("shipped\n");
  });

  it("lists mount points inside their parent", async () => {
    expect(await makeVfs().readdir("/")).toEqual(expect.arrayContaining(["home", "proc", "etc"]));
    expect((await makeVfs().stat("/proc"))?.type).toBe("dir");
  });
});

describe("Vfs errors carry the absolute path", () => {
  it("for the overlay mount", async () => {
    const vfs = makeVfs();
    expect(await msg(vfs.unlink("/home/guest/nothere"))).toBe("/home/guest/nothere: No such file or directory");
    expect(await msg(vfs.readFile("/home/guest/october"))).toBe("/home/guest/october: Is a directory");
    expect(await msg(vfs.unlink("/home/guest/october"))).toBe("/home/guest/october: Is a directory");
  });

  it("for the read-only root", async () => {
    const vfs = makeVfs();
    expect(await msg(vfs.unlink("/etc/motd"))).toBe("/etc/motd: Read-only file system");
    expect(await msg(vfs.readFile("/etc/nope"))).toBe("/etc/nope: No such file or directory");
  });

  it("for procfs", async () => {
    const vfs = makeVfs();
    expect(await msg(vfs.readFile("/proc/42/status"))).toBe("/proc/42/status: No such file or directory");
    expect(await msg(vfs.readFile("/proc/1"))).toBe("/proc/1: Is a directory");
    expect(await msg(vfs.unlink("/proc/1/status"))).toBe("/proc/1/status: Read-only file system");
    expect(await msg(vfs.writeFile("/proc/1/status", "x"))).toBe("/proc/1/status: Read-only file system");
    expect(await msg(vfs.readdir("/proc/42"))).toBe("/proc/42: No such file or directory");
  });

  it("reads generated procfs files", async () => {
    expect(await makeVfs().readFile("/proc/1/cwd")).toBe("/");
  });
});
