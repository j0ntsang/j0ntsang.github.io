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
│   └── sidebar slot          ← live system info panel (HTML Template)
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
| `sidebar-system-info.html` | Mount point for the live system info panel |

`TemplateManager` fetches each file, extracts the `<template>`, appends it to `<body>`, then clones and mounts instances on demand via `TemplateManager.create()` / `TemplateManager.mount()`.

### 4. xterm.js — Terminal Emulator (`src/terminal/`)

The main window is an interactive terminal powered by [`@xterm/xterm`](https://xtermjs.org/).

- **`index.js`** — Initializes the terminal, reads CSS custom properties to match the current theme, loads a MOTD from the path configured in `config.json`, and starts the prompt loop.
- **`prompt.js`** — Interactive prompt loop powered by [`local-echo`](https://github.com/wavesoft/local-echo) for full line-editing (history, cursor movement, Ctrl+C). Commands: `help`, `about`, `resume`, `github`, `linkedin`, `codepen`, `clear`. Includes an `AnsiAwareString` shim so ANSI-colored prompts work correctly with `local-echo`'s line-width calculations.
- **`config.json`** — Terminal configuration; currently sets `welcomeMessage` to the MOTD path (`templates/motd.txt`).
- Theme syncs live with both OS `prefers-color-scheme` changes and manual dark/light class toggles via `MutationObserver`.
- Terminal resizing is handled by a `ResizeObserver` that reads xterm's internal cell dimensions (replacing `FitAddon`) and calls `term.resize()`.

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
- **`components/Divider.tsx`** — A Styled Components example component.
- **`hooks/useTitleAnimation.js`** — Animates the browser tab title with a configurable spinner (`spinner_line`, `spinner_circle`, `ellipsis`) or progress bar (`hash_dot`) using `requestAnimationFrame`.

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
│   │   ├── index.js                  # xterm.js setup, MOTD, theme sync, resize
│   │   ├── prompt.js                 # local-echo prompt loop + shell commands
│   │   ├── config.json               # Terminal config (MOTD path)
│   │   └── sidebarSystemInfo.js      # Live system info sidebar
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
│   │   ├── terminal.html
│   │   ├── sidebar-system-info.html
│   │   └── motd.txt                  # Message of the day (plain text, ANSI escape sequences)
│   └── thrive/                       # Embedded sub-project (separate Vite build)
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
- **React** — coexists with vanilla code, ready to take over more of the UI
- **Styled Components + Tailwind** — both CSS-in-JS and utility-first approaches demonstrated together
- **No build-time HTML** — the shell is static HTML; JavaScript layers in progressively
