# Jonathan Tsang — Frontend Developer Portfolio

A frontend portfolio built as a deliberate mix of web technologies — vanilla HTML/CSS, Web Components, HTML Templates, React, xterm.js, Styled Components, and Tailwind CSS — styled after a Linux tiling window manager with a terminal/CRT aesthetic.

---

## Architecture Overview

The site intentionally blends multiple rendering paradigms to demonstrate breadth across the frontend stack. No single framework owns the page; each layer of the UI uses the technology most suited to it.

```
index.html
├── <window-manager>          ← Web Component (Shadow DOM layout)
│   ├── waybar-right slot     ← fullscreen toggle + settings menu (HTML Templates)
│   ├── master slot           ← xterm.js terminal (HTML Template)
│   └── sidebar slot          ← live system info panel (React portal)
└── #react                    ← React 18 root (TypeScript)
```

### Entry Points

Two scripts are loaded as ES modules from `index.html`:

| File | Role |
|------|------|
| `src/init.js` | Registers the Web Component, loads HTML Templates, boots the terminal and sidebar |
| `src/index.tsx` | Mounts the React app into `#react` |

Both run after `DOMContentLoaded` independently. React and the vanilla layer coexist without interfering.

---

## Technology Layers

### 1. Vanilla HTML/CSS — Shell & Theming (`index.html`)

The outer shell is pure HTML/CSS. Key features defined inline:

- **CRT turn-on animation** — a `crtTurnOn` keyframe scales the screen from `0,0` to `1,1` on load, simulating an old CRT monitor powering on.
- **Fade-in** — content fades from 50% opacity to 100% via `fadeIn`.
- **Dark/light theming** — CSS custom properties (`--background-color`, `--text-color`) are set by toggling `.dark` / `.light` on `<html>`. Defaults to the OS preference via `prefers-color-scheme`. Both modes are defined in `:root` and switched by class.
- **Monospace font stack** — Consolas → Courier New → Menlo → Monaco → Liberation Mono, reinforcing the terminal aesthetic.
- **Reduced-motion** — all animations are gated on `prefers-reduced-motion: no-preference`.

### 2. Web Components — Window Manager Layout (`src/web-components/window-manager/`)

`<window-manager>` is a custom element using **Shadow DOM** for style isolation, with layout styles extracted into `window-manager.styles.ts`. It provides a three-region tiling layout via named slots:

| Slot | Region |
|------|--------|
| `waybar-left` | Left side of the top bar |
| `waybar-right` | Right side of the top bar (settings, fullscreen) |
| `master` | Main content window (terminal) |
| `sidebar` | Right sidebar panel |

The naming mirrors Linux compositor tooling (Waybar, Hyprland) intentionally.

### 3. HTML Templates — Lazy-loaded UI Fragments (`public/templates/`)

Reusable UI pieces are authored as `<template>` elements in standalone HTML files and fetched at runtime by `TemplateManager` (`src/util/templateManager.ts`). This keeps templates out of the main HTML and lets them carry their own scoped `<style>` blocks.

| Template | Purpose |
|----------|---------|
| `fullscreen-toggle.html` | Browser fullscreen button (⛶/⧉ icon, cross-browser API) |
| `settings-menu.html` | Gear icon `<details>` dropdown — dark mode, animation, layout toggles |
| `terminal.html` | xterm.js container shell with title bar |

`TemplateManager` fetches each file, extracts the `<template>`, appends it to `<body>`, then clones and mounts instances on demand via `TemplateManager.create()` / `TemplateManager.mount()`.

### 4. xterm.js + a small OS (`src/terminal/`, `src/os/`, `src/bin/`, `rootfs/`)

The main window is an [`@xterm/xterm`](https://xtermjs.org/) terminal running a tiny operating system, built to learn how the real thing fits together. Each piece models one OS concept:

| OS concept | Here |
|---|---|
| Disk image | `rootfs/` — baked into the build by Vite, read-only (GitHub Pages is static) |
| VFS + mounts | `src/os/fs/vfs.ts` — `/` rootfs, `/home` + `/var` overlay, `/proc` |
| overlayfs | `src/os/fs/overlayfs.ts` — your changes copied up into localStorage; `rm` reverts to the shipped file |
| procfs | `src/os/fs/procfs.ts` — generated from the process table; `ps` just reads it |
| Kernel / processes | `src/os/kernel/` — pid, argv, cwd, env, exit codes, SIGINT via `AbortSignal` |
| Syscalls | `src/os/kernel/syscalls.ts` — the only API programs get; no DOM or storage access |
| Executables + `$PATH` | `rootfs/usr/bin/october` holds `#!module:october`; the kernel lazy-loads `src/bin/october.tsx` |
| TTY + line discipline | `src/os/tty/tty.ts` — xterm is the device, `local-echo` is canonical-mode line editing |
| Display server | `src/os/display/compositor.ts` — hands a process a bare `HTMLElement` surface (Wayland-style) |
| GUI toolkits | `src/os/display/toolkits/` — each program draws with React, a `<template>`, a web component or raw DOM |
| init + shell | `src/bin/init.ts` (PID 1) prints `/etc/motd` and respawns `src/bin/sh.ts` |

`src/terminal/index.js` sets up xterm (theme sync, resize, OSC title/links), waits for a keypress, then calls `bootKernel()`.

**Adding a program:** write `src/bin/<name>.ts` exporting `default (argv, sys) => exitCode`, then add `rootfs/usr/bin/<name>` containing `#!module:<name>` plus `#summary:` / `#usage:` lines (that's what `help` prints).

**`october`** — movie-a-day calendar. Data lives in `rootfs/home/guest/october/<year>.json`. Each day has a display `title` and optional `wiki` article title; posters and links are hotlinked from Wikipedia. Wikimedia sends CORS headers, which COEP `require-corp` needs, and no API key is required. Lookups are cached in `/var/cache/october/wiki.json`. To add or remove movies, click an empty day or a day's `+` and search Wikipedia by title. Picking a result fills in the poster and link, and a day can hold more than one movie. To publish your cross-offs, `cat ~/october/2026.json` into the rootfs file and deploy.

### 5. Sidebar System Info (`src/terminal/sidebarSystemInfo.js`)

A live-updating panel in the sidebar that displays browser and client environment data:

**Sections:** NETWORK · TIME · NAVIGATION · SYSTEM · DISPLAY · VIEWPORT · BROWSER · FEATURES · PAGE

Updates are batched with `requestAnimationFrame` and driven by browser events (`resize`, `popstate`, `hashchange`, `online`, `offline`) plus a 1-second `setInterval` for the clock. Only changed DOM nodes are updated via a keyed `Map`.

### 6. TypeScript Utilities (`src/util/`)

| File | Purpose |
|------|---------|
| `templateManager.ts` | Fetch, parse, clone, and mount `<template>` elements |
| `templateLoader.js` | Orchestrates batch template loading and mounting; wires up fullscreen and settings after mount |
| `settingsMenu.ts` | Wire up settings checkboxes; persist theme + animation to `localStorage` |
| `fullscreenToggle.ts` | Cross-browser Fullscreen API (standard + webkit + ms prefixes) |

### 7. React + TypeScript (`src/react/`)

React 18 is mounted into `#react` alongside the vanilla layer.

- **`App.tsx`** — Currently renders an empty fragment; serves as the React root.

### 8. Styling Tools

| Tool | Usage |
|------|-------|
| **Styled Components** | CSS-in-JS for React components (e.g. `Divider`) |
| **Tailwind CSS** | Utility class config in place for React component use |
| **PostCSS** | Processes Tailwind |
| **Inline CSS** | Global theming, animations, and layout in `index.html` |
| **Template `<style>`** | Scoped styles shipped with each HTML Template fragment |

---

## Project Structure

```
├── index.html                        # Entry point — theming, layout shell, script imports
├── src/
│   ├── init.js                       # Vanilla bootstrap: Web Component + Templates + terminal
│   ├── index.tsx                     # React bootstrap
│   ├── web-components/
│   │   └── window-manager/
│   │       ├── window-manager.js     # <window-manager> custom element (Shadow DOM)
│   │       └── window-manager.styles.ts  # Shadow DOM layout styles
│   ├── terminal/
│   │   └── index.js                  # xterm.js setup, theme sync, resize, boot
│   ├── os/                           # The kernel: fs/, kernel/, tty/, display/, lib/, boot.ts
│   ├── bin/                          # User-space programs (sh, init, ls, cat, ps, october…)
│   ├── apps/october/                 # October calendar UI (React) + Wikipedia lookup
│   ├── util/
│   │   ├── templateManager.ts        # HTML Template loader/mounter
│   │   ├── templateLoader.js         # Batch template orchestration + wiring
│   │   ├── settingsMenu.ts           # Dark mode + animation settings
│   │   └── fullscreenToggle.ts       # Fullscreen API wrapper
│   └── react/
│       ├── App.tsx                   # React root component
│       ├── components/Divider.tsx    # Styled Components example
│       └── hooks/useTitleAnimation.js # Tab title animation hook
├── public/
│   ├── templates/                    # HTML Template fragments (lazy-loaded)
│   │   ├── fullscreen-toggle.html
│   │   ├── settings-menu.html
│   │   └── terminal.html
│   └── thrive/                       # Embedded sub-project (separate Vite build)
├── rootfs/                           # Read-only disk image: bin/, sbin/, usr/bin/, etc/motd, home/guest/
├── tailwind.config.js
└── postcss.config.js
```

---

## Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `@xterm/xterm` | Terminal emulator |
| `@xterm/addon-fit` | Fit addon (imported but resize is handled manually via `ResizeObserver`) |
| `local-echo` | Line-editing controller for the prompt loop (history, cursor, Ctrl+C) |
| `coi-serviceworker` | Cross-Origin Isolation service worker — enables `SharedArrayBuffer` for future WASM shell integration |

---

## Design Philosophy

The site is built to be a portfolio of techniques, not just a portfolio of work. Each technology is chosen for a reason:

- **Web Components** — framework-agnostic, encapsulated layout that works alongside React without conflict
- **HTML Templates** — deferred, fetchable UI fragments that keep `index.html` clean
- **xterm.js** — a real terminal emulator, not a styled `<pre>` block
- **React** — one toolkit among several, portalled in where it fits; mixed with vanilla code on purpose rather than replacing it
- **Styled Components + Tailwind** — both CSS-in-JS and utility-first approaches demonstrated together
- **No build-time HTML** — the shell is static HTML; JavaScript layers in progressively
