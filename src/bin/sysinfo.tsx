// /usr/bin/sysinfo — browser and connection info in the sidebar.
//
//   sysinfo [start]   start the daemon; its panel appears in the sidebar
//   sysinfo stop      stop it; the sidebar goes away
//   sysinfo status    print whether it's running
//
// `start` doesn't draw the panel itself: it spawns a second copy with
// --daemon, detached under init, and exits so the shell gets its prompt back.
// The daemon is found again the way pgrep does it: by reading /proc.

import { SysInfo } from "../apps/sysinfo/SysInfo";
import { mountReact } from "../os/display/toolkits/react";
import { C } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

const USAGE = "usage: sysinfo [start|stop|status]\n";
const DAEMON_ARGV = ["sysinfo", "--daemon"];

async function findDaemon(sys: Sys): Promise<number | null> {
  for (const pid of await sys.readdir("/proc")) {
    const cmdline = await sys.readFile(`/proc/${pid}/cmdline`).catch(() => "");
    if (cmdline === DAEMON_ARGV.join("\0")) return Number(pid);
  }
  return null;
}

async function daemon(sys: Sys) {
  const panel = sys.createPanel({ title: "sysInfo" });
  mountReact(panel, <SysInfo />);
  // Runs until signalled; the kernel then closes the panel with the process.
  await new Promise<void>((resolve) => sys.signal.addEventListener("abort", () => resolve()));
  return 0;
}

export default async function sysinfo(argv: string[], sys: Sys) {
  const [command = "start"] = argv.slice(1);
  if (command === "--daemon") return daemon(sys);

  const pid = await findDaemon(sys);
  switch (command) {
    case "start":
      if (pid !== null) {
        sys.write(`sysinfo: already running (pid ${pid})\n`);
        return 0;
      }
      void sys.spawn(sys.exe, DAEMON_ARGV, { daemon: true });
      return 0;
    case "stop":
      if (pid === null) {
        sys.error("sysinfo: not running\n");
        return 1;
      }
      sys.kill(pid, "SIGTERM");
      return 0;
    case "status":
      sys.write(pid !== null ? `sysinfo: ${C.green}running${C.reset} (pid ${pid})\n` : `sysinfo: ${C.dim}stopped${C.reset}\n`);
      return pid !== null ? 0 : 3;
    case "-h":
    case "--help":
      sys.write(USAGE);
      return 0;
    default:
      sys.error(`sysinfo: unknown command '${command}'\n${USAGE}`);
      return 2;
  }
}
