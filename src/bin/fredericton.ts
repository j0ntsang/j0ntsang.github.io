// /usr/bin/fredericton — civic dashboard for Fredericton, NB.
//
//   fredericton               open it in a window
//   fredericton news          open at a section
//   fredericton --tab [page]  open it in a new browser tab instead
//
// The app is a separate build (fredericton/ in the repo) served at /fredericton/. This
// program only embeds it in a window; see toolkits/frame.

import { mountFrame } from "../os/display/toolkits/frame";
import type { Sys } from "../os/kernel/syscalls";

const PAGES = ["home", "getting-around", "health-safety", "things-to-do", "city-watch", "news", "contacts", "sources"];
const USAGE = `usage: fredericton [--tab] [page]\npages: ${PAGES.join(", ")}\n`;

export default async function fredericton(argv: string[], sys: Sys) {
  const args = argv.slice(1);
  if (args.includes("-h") || args.includes("--help")) {
    sys.write(USAGE);
    return 0;
  }

  const page = args.find((a) => !a.startsWith("-"));
  if (page && !PAGES.includes(page)) {
    sys.error(`fredericton: no page '${page}'\n${USAGE}`);
    return 2;
  }
  const url = `fredericton/${page ? `${page}/` : ""}`;

  if (args.includes("--tab")) {
    sys.openUrl(url);
    return 0;
  }

  const surface = sys.createWindow({ title: "Fredericton today", maximized: true });
  mountFrame(surface, url, "Fredericton today");
  await surface.closed;
  return 0;
}
