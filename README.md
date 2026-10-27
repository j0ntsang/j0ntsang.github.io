# Jonathan Tsang — Frontend Developer Portfolio

A frontend portfolio built as a deliberate mix of web technologies — vanilla HTML/CSS, Web Components, HTML Templates, React, xterm.js, Styled Components, and Tailwind CSS — styled after a Linux tiling window manager with a terminal/CRT aesthetic.

---

## Architecture Overview

The site intentionally blends multiple rendering paradigms to demonstrate breadth across the frontend stack. No single framework owns the page; each layer of the UI has its own flavor.

```
index.html
├── <window-manager>          ← Web Component (Shadow DOM layout)
│   ├── waybar-right slot     ← sidebar toggle + fullscreen toggle + settings menu (HTML Templates)
│   ├── main slot             ← xterm.js terminal (HTML Template)
│   ├── windows slot          ← program windows (#window-layer), floated over the terminal
│   └── sidebar slot          ← panels from the OS compositor (the sysinfo daemon, once started)
└── #react                    ← React 18 root (TypeScript)
```

### Entry Points

Two scripts are loaded as ES modules from `index.html`:

| File | Role |
|------|------|
| `src/init.js` | Registers the Web Component, loads HTML Templates, boots the terminal |
| `src/index.tsx` | Mounts the React app into `#react` |

Both run after `DOMContentLoaded` independently. React and the vanilla layer coexist without interfering.

---

## Technology Layers

### 1. Vanilla HTML/CSS — Shell & Theming (`index.html`)

The outer shell is pure HTML/CSS. Key features defined inline:

- **CRT turn-on animation** — a `crtTurnOn` keyframe scales the screen from `0,0` to `1,1` on load, simulating an old CRT monitor powering on.
- **Fade-in** — content fades from 50% opacity to 100% via `fadeIn`.
- **Themes** — CSS custom properties (`--background-color`, `--text-color`, `--focus-ring`, …) are defined per theme in `src/styles/themes.css` and picked by `<html data-theme>` (`default`, `october`, `fallout`). The Settings menu's Theme select sets it and remembers it in `localStorage`; `src/os/display/theme.ts` applies it, and a program window (`october`) can ask for its own theme while it's open.
- **Monospace font stack** — Consolas → Courier New → Menlo → Monaco → Liberation Mono, reinforcing the terminal aesthetic.
- **Animation setting** — motion is gated on the `animation` class on `<html>`, set before first paint from Settings' Animation toggle (until it's touched, it follows `prefers-reduced-motion`). Durations are multiplied by `--motion` (0 when off), which also reaches into shadow roots.

### 2. Web Components — Window Manager Layout (`src/web-components/window-manager/`)

`<window-manager>` is a custom element using **Shadow DOM** for style isolation, with layout styles extracted into `window-manager.styles.ts`. It provides a three-region tiling layout via named slots:

| Slot | Region |
|------|--------|
| `waybar-left` | Left side of the top bar |
| `waybar-right` | Right side of the top bar (sidebar toggle, fullscreen, settings) |
| `main` | Main content window (terminal) |
| `windows` | Program windows (`#window-layer`), floated over `main` |
| `sidebar` | Right sidebar; the column animates closed when no panel is slotted or the user hides it (`toggleSidebar()`) |

The naming mirrors Linux compositor tooling (Waybar, Hyprland) intentionally.

### 3. HTML Templates — Lazy-loaded UI Fragments (`public/templates/`)

Reusable UI pieces are authored as `<template>` elements in standalone HTML files and fetched at runtime by `TemplateManager` (`src/util/templateManager.ts`). This keeps templates out of the main HTML and lets them carry their own scoped `<style>` blocks.

| Template | Purpose |
|----------|---------|
| `fullscreen-toggle.html` | Browser fullscreen button (⛶/⧉ icon, cross-browser API); removed when the browser can't do fullscreen |
| `sidebar-toggle.html` | ◨ button that hides/shows the sidebar; only mounted while the sidebar has content |
| `settings-menu.html` | Gear icon `<details>` dropdown — Animation toggle and Theme select |
| `terminal.html` | xterm.js container shell with title bar |

`TemplateManager` fetches each file, extracts the `<template>`, appends it to `<body>`, then clones and mounts instances on demand via `TemplateManager.create()` / `TemplateManager.mount()`. It throws on a failed fetch or a missing template.

### 4. xterm.js + a small OS (`src/terminal/`, `src/os/`, `src/bin/`, `rootfs/`)

The main window is an [`@xterm/xterm`](https://xtermjs.org/) terminal running a tiny operating system, built to learn how the real thing fits together. Each piece models one OS concept:

| OS concept | Here |
|---|---|
| Disk image | `rootfs/` — baked into the build by Vite, read-only (GitHub Pages is static) |
| VFS + mounts | `src/os/fs/vfs.ts` — `/` rootfs, `/home` + `/var` overlay, `/proc` |
| overlayfs | `src/os/fs/overlayfs.ts` — your changes copied up into localStorage; `rm` reverts to the shipped file; a write fails with ENOSPC when storage is full |
| procfs | `src/os/fs/procfs.ts` — generated from the process table; `ps` just reads it |
| Kernel / processes | `src/os/kernel/` — pid, argv, cwd, env, exit codes, SIGINT via `AbortSignal` |
| Syscalls | `src/os/kernel/syscalls.ts` — the only API programs get; no DOM or storage access |
| Executables + `$PATH` | `rootfs/usr/bin/october` holds `#!module:october`; the kernel lazy-loads `src/bin/october.tsx` |
| TTY + line discipline | `src/os/tty/tty.ts` — xterm is the device, `local-echo` is canonical-mode line editing |
| Display server | `src/os/display/compositor.ts` — hands a process a bare `HTMLElement` surface (Wayland-style): a window over the terminal, or a sidebar panel (like layer-shell). Windows float in the `windows` slot and make the terminal `inert` while one is open (focus returns to the terminal when the last closes). A window can ask to be `maximized` (`october` does): the sidebar hides while it's open and comes back when it closes |
| Daemons + signals | `spawn(…, { daemon: true })` re-parents to init (PPID 1); `kill <pid>` sends SIGTERM/SIGINT; a killed process unwinds at its next blocking syscall (`readLine`, `spawn`) |
| GUI toolkits | `src/os/display/toolkits/` — each program draws with React, a `<template>`, a web component or raw DOM |
| init + shell | `src/bin/init.ts` (PID 1) prints `/etc/motd` and respawns `src/bin/sh.ts`; a shell that keeps dying within a second is disabled for 5 minutes ("respawning too fast"). If init itself exits, the kernel panics and asks for a reload |

`src/terminal/index.js` sets up xterm (theme sync, resize, OSC title/links), waits for a keypress, then calls `bootKernel()`. Boot prints a status line per step; a failed non-fatal step (such as `SharedArrayBuffer` being unavailable) only warns.

**Adding a program:** write `src/bin/<name>.ts` exporting `default (argv, sys) => exitCode`, then add `rootfs/usr/bin/<name>` containing `#!module:<name>` plus `#summary:` / `#usage:` lines (that's what `help` prints).

**`october`** — movie-a-day calendar. The shipped calendar is `rootfs/usr/share/october/<year>.json` (read-only at `/usr/share/october`). Each day has a display `title` and optional `wiki` article title; posters and links are hotlinked from Wikipedia. A day set to `{}` is one you missed: blood pools at the top of its cell and drips down (static when the Animation setting is off or under `prefers-reduced-motion`), and adding a movie to it makes it up. Wikimedia sends CORS headers, which COEP `require-corp` needs, and no API key is required. Lookups are cached in `/var/cache/october/wiki.json`; misses and posterless pages are retried after a day. A calendar that can't load, a corrupt copy, and a failed save or reset show an error message instead of failing silently. To add or remove movies, click an empty day or a day's `+` and search Wikipedia by title. Picking a result fills in the poster and link, and a day can hold more than one movie. Click a poster to cross it off (struck through under a red wash). Your changes are saved to `~/october/<year>.json` as a version 2 diff against the shipped file (`added`, `crossedOff` and `removed` movies per day) and applied over it on load, so shipped edits always show and removals persist. A copy from the older format is converted on load, and its original text is backed up to `~/october/<year>.legacy.json` before the first save or reset. **Export** downloads the merged year as JSON; to publish it, copy it over the rootfs file and deploy. **Click to reset** (asks twice) deletes your copy; it's disabled when you have none.

### 5. sysinfo (`src/bin/sysinfo.tsx`, `src/apps/sysinfo/`)

A daemon that draws a live-updating panel of browser and client environment data in the sidebar. Nothing starts it at boot: run `sysinfo start` to open the sidebar. `sysinfo stop` (or `kill <pid>`) stops it and the sidebar collapses; `sysinfo start` starts it (or brings it back), and `sysinfo status` reports it. The ◨ waybar button only hides/shows the sidebar: sysinfo keeps running underneath. `sysinfo start` spawns a second copy with `--daemon` and exits, so the shell gets its prompt back; the daemon is found again by reading `/proc`, like `pgrep`.

The panel has System and Connection tabs.

**Startup order:** the page loads the terminal into the `main` slot → a keypress boots the kernel → a shell prompt, with no sidebar yet → `sysinfo start` fills the `sidebar` slot with the panel and the ◨ sidebar toggle appears. `tests/startup.spec.ts` checks this.

**Sections:** NETWORK · TIME · NAVIGATION · SYSTEM · DISPLAY · VIEWPORT · BROWSER · FEATURES · PAGE

The panel is plain React state, updated by browser events (`resize`, `popstate`, `hashchange`, `online`, `offline`) plus a 1-second `setInterval` for the clock.

### 6. TypeScript Utilities (`src/util/`)

| File | Purpose |
|------|---------|
| `templateManager.ts` | Fetch, parse, clone, and mount `<template>` elements |
| `templateLoader.js` | Loads and mounts each template independently; only the terminal template is essential (the rest are skipped with a warning if they fail), and a terminal failure shows an error message; wires up fullscreen and settings after mount |
| `settingsMenu.ts` | Wire up settings checkboxes; persist theme + animation to `localStorage` |
| `fullscreenToggle.ts` | Cross-browser Fullscreen API (standard + webkit + ms prefixes) |
| `sidebarToggle.ts` | Waybar button for the window manager's sidebar; appears/disappears with sidebar content |

### 7. React + TypeScript (`src/react/`)

React 18 is mounted into `#react` alongside the vanilla layer.

- **`App.tsx`** — Currently renders nothing (`null`); serves as the React root.

### 8. Styling Tools

| Tool | Usage |
|------|-------|
| **Styled Components** | Installed, not currently used |
| **Tailwind CSS** | Config in place and utilities are emitted by `src/index.css`, but no component uses them yet |
| **PostCSS** | Processes Tailwind |
| **Inline CSS** | Global theming, animations, and layout in `index.html` |
| **Template `<style>`** | Scoped styles shipped with each HTML Template fragment |
| **Shared system CSS** | `src/styles/scrollbar.css`: one scrollbar style, imported by the document and inlined (`?inline`) into every shadow root, since `::-webkit-scrollbar` doesn't cross shadow boundaries |

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
│   ├── os/                           # The kernel: fs/, kernel/, tty/, display/, lib/, boot.ts (unit tests in fs/__tests__)
│   ├── bin/                          # User-space programs (sh, init, ls, cat, ps, october…)
│   ├── apps/october/                 # October calendar UI (React), model, Wikipedia lookup (unit tests in __tests__)
│   ├── apps/sysinfo/                 # sysinfo sidebar panel UI (React)
│   ├── util/
│   │   ├── templateManager.ts        # HTML Template loader/mounter
│   │   ├── templateLoader.js         # Batch template orchestration + wiring
│   │   ├── settingsMenu.ts           # Theme + animation settings
│   │   ├── fullscreenToggle.ts       # Fullscreen API wrapper
│   │   └── sidebarToggle.ts          # Waybar show/hide button for the sidebar
│   ├── styles/                       # themes.css (per-theme tokens), scrollbar.css
│   ├── vite-env.d.ts                 # Vite client types
│   └── react/
│       └── App.tsx                   # React root component
├── public/
│   ├── templates/                    # HTML Template fragments (lazy-loaded)
│   │   ├── fullscreen-toggle.html
│   │   ├── sidebar-toggle.html
│   │   ├── settings-menu.html
│   │   └── terminal.html
│   └── thrive/                       # Embedded sub-project (separate Vite build)
├── rootfs/                           # Read-only disk image: bin/, sbin/, usr/bin/, etc/motd, home/guest/
├── tests/                            # Playwright end-to-end specs
├── vitest.config.ts                  # Unit test config (src/**/*.test.ts)
├── tailwind.config.cjs
└── postcss.config.cjs
```

---

## Testing

Two layers, both run by `npm test` (unit first, then end-to-end):

```
npm run test:unit   # Vitest, node environment, src/**/*.test.ts
npm run test:e2e    # Playwright, Chromium, tests/
```

**Unit** tests cover the pure modules: the overlay/VFS/path code in `src/os/fs/__tests__/` and the october model, shipped data and Wikipedia cache in `src/apps/october/__tests__/`.

**End-to-end** tests run in Chromium with [Playwright](https://playwright.dev/), against the Vite dev server (started automatically). Every test also fails on any page or console error. Specs in `tests/`, with shared helpers in `tests/helpers.ts`:

| Spec | Covers |
|------|--------|
| `startup.spec.ts` | Startup order (terminal only, sysinfo off after boot), the sidebar and its icon as `sysinfo` starts and stops |
| `shell.spec.ts` | Prompt and exit codes, coreutils errors, paths and completion, signals |
| `sysinfo.spec.ts` | The sidebar panel's structure and keyboard use |
| `october.spec.ts` | The calendar window, your saved copy, Wikipedia lookups, the Animation setting |
| `settings.spec.ts` | Settings menu, theme and animation persistence, fullscreen button |
| `templates.spec.ts` | Template load failures |
| `prod.spec.ts` | The production build and its service worker |

## Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `@xterm/xterm` | Terminal emulator |
| `@xterm/addon-fit` | Fit addon; `fit()` runs on load and on `ResizeObserver` resizes (debounced with `requestAnimationFrame`) |
| `local-echo` | Line-editing controller for the prompt loop (history, cursor, Ctrl+C) |
| `coi-serviceworker` | Cross-Origin Isolation service worker — enables `SharedArrayBuffer` for future WASM shell integration (boot only warns if it's missing) |

---

## Design Philosophy

The site is built to be a portfolio of techniques, not just a portfolio of work. Each technology is chosen for a reason:

- **Web Components** — framework-agnostic, encapsulated layout that works alongside React without conflict
- **HTML Templates** — deferred, fetchable UI fragments that keep `index.html` clean
- **xterm.js** — a real terminal emulator, not a styled `<pre>` block
- **React** — one toolkit among several, portalled in where it fits; mixed with vanilla code on purpose rather than replacing it
- **Styled Components + Tailwind** — both CSS-in-JS and utility-first approaches demonstrated together
- **No build-time HTML** — the shell is static HTML; JavaScript layers in progressively

### Accessibility: WCAG 2.2 AA, always

Every change must keep the site [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) compliant. It's a requirement, not a nice-to-have:

- **Text contrast** — at least 4.5:1 against its background, or 3:1 for large text (24px+, or 18.66px+ bold). Text over images (October posters) needs an overlay that guarantees this over any poster.
- **Non-text contrast** — 3:1 for icons, button borders, focus rings and other UI parts needed to understand or operate the page.
- **Keyboard** — everything works without a mouse, with a visible focus indicator.
- **Names and states** — controls have accessible names, and toggles expose their state (`aria-pressed`, `aria-selected`).
- **Motion** — animations respect `prefers-reduced-motion`.

New colours come from the existing tokens (`--text-color`, `--background-color`, …); check any new pairing's contrast before using it.
