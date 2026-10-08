// display/compositor — the display server.
//
// Like Wayland, the protocol is deliberately dumb: a process asks for a
// surface and gets back a bare HTMLElement. What it draws there — React, a
// web component, a <template>, raw DOM — is the program's business (its
// "toolkit"). The compositor only owns window chrome, stacking and focus.

import "./program-window";

import type { ProgramWindow } from "./program-window";
import { setWindowTheme, type Theme } from "./theme";

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
  win: HTMLElement;
  theme?: Theme;
}

interface PanelHost extends HTMLElement {
  readonly sidebarOpen?: boolean;
  toggleSidebar?(open?: boolean): void;
}

export interface WindowOptions {
  maximized?: boolean;
  /** Recolor the whole system while this window is on top. */
  theme?: Theme;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export class Compositor {
  private windows: Entry[] = [];
  private panels: Entry[] = [];
  private nextId = 1;
  private maximized = 0;
  private sidebarWasOpen = false;

  /** Wired by the kernel: Ctrl-C inside a window signals its process. */
  onInterrupt: (pid: number) => void = () => {};
  /** Wired by the kernel: focus goes back to the TTY when the last window closes. */
  onEmpty: () => void = () => {};

  constructor(private host: HTMLElement, private panelHost: PanelHost) {
    host.hidden = true;
  }

  createPanel(pid: number): Surface {
    const el = document.createElement("div");
    el.className = "surface";
    el.slot = "sidebar";

    const teardown: (() => void)[] = [];
    let resolveClosed!: () => void;
    const closed = new Promise<void>((r) => (resolveClosed = r));

    const surface: Surface = {
      id: this.nextId++,
      pid,
      el,
      closed,
      setTitle: (t) => el.setAttribute("aria-label", t),
      onClose: (fn) => teardown.push(fn),
      close: () => {
        if (!el.isConnected) return;
        teardown.forEach((fn) => fn());
        el.remove();
        this.panels = this.panels.filter((p) => p.win !== el);
        resolveClosed();
      },
    };

    this.panels.push({ surface, win: el });
    this.panelHost.append(el);
    return surface;
  }

  createWindow(pid: number, title: string, opts: WindowOptions = {}): Surface {
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
        if (opts.maximized) this.unmaximize();
        resolveClosed();
        this.raiseTop();
      },
    };

    win.heading = title;
    win.onRequestClose = surface.close;
    if (opts.maximized) this.maximize();
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

    this.windows.push({ surface, win, theme: opts.theme });
    this.host.append(win);
    this.syncTheme();
    this.host.hidden = false;
    requestAnimationFrame(() => {
      if (!win.contains(document.activeElement)) win.focus();
    });
    return surface;
  }

  private maximize() {
    if (this.maximized++ > 0) return;
    this.sidebarWasOpen = !!this.panelHost.sidebarOpen;
    this.panelHost.toggleSidebar?.(false);
  }

  private unmaximize() {
    if (--this.maximized > 0) return;
    if (this.sidebarWasOpen && !this.panelHost.sidebarOpen) this.panelHost.toggleSidebar?.(true);
  }

  closeAll(pid: number) {
    [...this.windows, ...this.panels].filter((w) => w.surface.pid === pid).forEach((w) => w.surface.close());
  }

  private syncTheme() {
    setWindowTheme(this.windows[this.windows.length - 1]?.theme ?? null);
  }

  private raiseTop() {
    this.syncTheme();
    const top = this.windows[this.windows.length - 1];
    if (top) {
      top.win.focus();
    } else {
      this.host.hidden = true;
      this.onEmpty();
    }
  }
}
