// display/compositor — the display server.
//
// Like Wayland, the protocol is deliberately dumb: a process asks for a
// surface and gets back a bare HTMLElement. What it draws there — React, a
// web component, a <template>, raw DOM — is the program's business (its
// "toolkit"). The compositor only owns window chrome, stacking and focus.

import "./program-window";

import type { ProgramWindow } from "./program-window";

export interface Surface {
  readonly id: number;
  readonly pid: number;
  /** The element the program renders into. */
  readonly el: HTMLElement;
  /** Resolves once the window has closed, for whatever reason. */
  readonly closed: Promise<void>;
  setTitle(title: string): void;
  /** Register teardown (unmount React, remove listeners…). */
  onClose(fn: () => void): void;
  close(): void;
}

interface Entry {
  surface: Surface;
  win: ProgramWindow;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export class Compositor {
  private windows: Entry[] = [];
  private nextId = 1;

  /** Wired by the kernel: Ctrl-C inside a window signals its process. */
  onInterrupt: (pid: number) => void = () => {};
  /** Wired by the kernel: focus goes back to the TTY when the last window closes. */
  onEmpty: () => void = () => {};

  constructor(private host: HTMLElement) {
    host.hidden = true;
  }

  createWindow(pid: number, title: string): Surface {
    const win = document.createElement("program-window") as ProgramWindow;
    const el = document.createElement("div");
    el.className = "surface";
    win.appendChild(el);

    const teardown: (() => void)[] = [];
    let resolveClosed!: () => void;
    const closed = new Promise<void>((r) => (resolveClosed = r));

    const surface: Surface = {
      id: this.nextId++,
      pid,
      el,
      closed,
      setTitle: (t) => (win.heading = t),
      onClose: (fn) => teardown.push(fn),
      close: () => {
        if (!win.isConnected) return;
        teardown.forEach((fn) => fn());
        win.remove();
        this.windows = this.windows.filter((w) => w.win !== win);
        resolveClosed();
        this.raiseTop();
      },
    };

    win.heading = title;
    win.onRequestClose = surface.close;
    win.addEventListener("keydown", (e) => {
      if (e.defaultPrevented) return;
      if (e.key === "Escape" || (e.key === "q" && !isTyping(e.target) && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        surface.close();
      } else if (e.key === "c" && e.ctrlKey && !window.getSelection()?.toString()) {
        e.preventDefault();
        this.onInterrupt(pid);
      }
    });

    this.windows.push({ surface, win });
    this.host.append(win);
    this.host.hidden = false;
    requestAnimationFrame(() => {
      if (!win.contains(document.activeElement)) win.focus();
    });
    return surface;
  }

  /** Called by the kernel when a process exits: its windows go with it. */
  closeAll(pid: number) {
    this.windows.filter((w) => w.surface.pid === pid).forEach((w) => w.surface.close());
  }

  private raiseTop() {
    const top = this.windows[this.windows.length - 1];
    if (top) {
      top.win.focus();
    } else {
      this.host.hidden = true;
      this.onEmpty();
    }
  }
}
