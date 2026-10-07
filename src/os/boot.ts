// boot — bring the machine up, in the same order a Linux kernel does:
//   1. mount the root filesystem (read-only disk image)
//   2. mount writable layers over the parts users change (/home, /var)
//   3. mount pseudo-filesystems (/proc)
//   4. hand control to PID 1, /sbin/init, which starts the shell

import type { Terminal } from "@xterm/xterm";

import { Compositor } from "./display/compositor";
import { overlayfs } from "./fs/overlayfs";
import { procfs } from "./fs/procfs";
import { rootfs, subtree } from "./fs/rootfs";
import { Vfs } from "./fs/vfs";
import { Kernel } from "./kernel/kernel";
import { Tty } from "./tty/tty";

type Step = (label: string, fn: () => Promise<void>) => Promise<void>;

export async function bootKernel(term: Terminal, step: Step) {
  const display = document.getElementById("display");
  if (!display) throw new Error("#display element not found");
  const windowManager = document.querySelector("window-manager");
  if (!(windowManager instanceof HTMLElement)) throw new Error("<window-manager> element not found");

  const vfs = new Vfs();
  const tty = new Tty(term);
  const kernel = new Kernel(vfs, tty, new Compositor(display, windowManager));

  await step("Mounting rootfs on / (read-only)", async () => {
    vfs.mount("/", rootfs);
    if (!(await vfs.stat("/sbin/init"))) throw new Error("/sbin/init missing from rootfs");
  });

  await step("Mounting overlayfs on /home, /var", async () => {
    vfs.mount("/home", overlayfs(subtree(rootfs, "/home"), "/home"));
    vfs.mount("/var", overlayfs(subtree(rootfs, "/var"), "/var"));
  });

  await step("Mounting procfs on /proc", async () => {
    vfs.mount("/proc", procfs(() => kernel.processes()));
  });

  await step("Starting /sbin/init", async () => {
    // PID 1 never exits, so don't await it.
    kernel.spawn("/sbin/init", ["init"], null, { foreground: true });
  });

  return kernel;
}
