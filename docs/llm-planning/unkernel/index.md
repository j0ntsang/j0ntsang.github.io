# unkernel: real Linux in the portfolio

Start here. Read this file, then the one step file you are executing. Each step file stands alone.

## Goal

1. **Now:** a visitor types `linux` in the existing shell and gets a real Linux shell (unkernel: Linux compiled to WebAssembly) in a program window. Nothing else changes.
2. **Then:** at boot, a GRUB-style menu offers the hand-built JavaScript OS or Linux. The Linux entry runs a customized guest shell straight in the main xterm.
3. **End state:** inside the Linux shell, `october`, `fredericton`, `sysinfo`, `resume`, etc. still open as the same React / iframe / template / web-component windows in the same `<window-manager>` layout. They are host programs that the guest runs through unkernel's host-command bridge, which runs over vsock. The layout keeps its mix of technologies. Only the shell underneath becomes real Linux.

## PRs and steps

| PR | Step | What |
|---|---|---|
| **PR 1: Linux in a window** | [01](step-01-sdk-and-vite.md) | Add `unkernel` (pinned), wire Vite, `src/os/unkernel/vm.ts` |
| | [02](step-02-distro-source.md) | Alpine image: fetched at build time (not committed); runtime `hosted` (range-read) or `download` (fetched during POST) |
| | [03](step-03-themed-terminal.md) | Extract xterm theme/fit/blink wiring into a reusable module (pure refactor) |
| | [04](step-04-linux-window.md) | `<vm-terminal>` web component + `/usr/bin/linux` program + GPL notices |
| | [05](step-05-pr1-tests-docs.md) | Playwright spec, README, ship PR 1 |
| **PR 2: GRUB + Linux as main terminal** | [06](step-06-grub-menu.md) | Split boot; GRUB menu, shown only when `checkSupport().ok`; otherwise JS kernel |
| | [07](step-07-linux-main-terminal.md) | Linux boot path in the main xterm (POST steps, login shell, respawn) |
| | [08](step-08-guest-customization.md) | Customized guest: motd, prompt, hostname, `help`, site files mounted, persistent home |
| **PR 3: App bridge** | [09](step-09-host-commands.md) | Stream-backed TTY in the JS kernel; headless JS kernel next to the VM; `commands` bridge |
| | [10](step-10-bridge-apps.md) | Register every `/usr/bin` app, signals and focus, tests, docs, ship PR 3 |

A new context starts after each step.

## Why

The site exists to learn how an OS fits together by building one (see the README's "small OS" section). unkernel is the real thing: a real Linux kernel with an MMU, ext4, overlayfs and ptys. Running it beside the hand-built kernel lets the two be compared, and the hand-built kernel stays as the fallback. The selling point of the portfolio is that no single framework owns the page. Linux must therefore slot *into* the existing display server rather than replace it.

Source article: https://fzakaria.com/2026/11/23/2035-came-early (trynix.dev, built on unkernel).

## Decisions (settled, do not re-litigate)

| # | Decision | Why |
|---|---|---|
| D1 | **Offline only.** Never pass `net` to `createKernel`. No Wisp relay. | User decision. GitHub Pages can't host a WebSocket relay, and unkernel's default relay only accepts known origins. Consequence: `apk add` doesn't work, and the guest has only what's on the image plus what we mount. |
| D2 | **Distro = Alpine** (`alpine.erofs`, 4,046,848 bytes) with two runtime modes: `hosted` (lazy Range reads from our own origin) and `download` (fetched whole during the boot POST, SHA-256 checked, cached). `none` (busybox base, no image) is also selectable. Debian (72 MB) is out of scope. | User asked for "hosted, or downloaded at runtime as part of the POST". |
| D3 | **The image is never committed.** `scripts/fetch-distro.mjs` downloads it at build time from the unkernel GitHub release that matches the installed package version, checks size and SHA-256 against that release's `distros.json`, and writes it to gitignored `public/distros/`. | Memory rule: no binary assets in the repo. |
| D4 | **Runtime fetches go to our own origin by default.** The image URL is configurable, but a non-same-origin host must send CORS plus `Cross-Origin-Resource-Policy`. | Verified 2026-11-24: `github.com/.../releases/download/...` sends **no** `Access-Control-Allow-Origin`, so the browser can't fetch it. The page runs COEP `require-corp`. GitHub Pages (jontsang.ca) **does** answer Range GETs with 206. |
| D5 | **Pin `unkernel` exactly** (`0.2.0-261124-c08e977`, no caret). | Prerelease. The distro image's `abi` must match the kernel (distros.json `"abi": 4`). |
| D6 | **Pass the kernel URL explicitly:** `import kernelUrl from "unkernel/unkernel.wasm?url"` → `createKernel({ kernel: kernelUrl })`. | The package resolves `new URL("./unkernel.wasm", import.meta.url)` itself, which breaks under Vite dep pre-bundling. The package's `exports` exposes `./unkernel.wasm`. |
| D7 | **unkernel only loads when used:** a dynamic import from a lazily loaded bin or boot path. The ~11.4 MB wasm never loads for JS-kernel visitors. | Mobile and slow connections. |
| D8 | **PR 1–2 run inline (main thread), 1 CPU.** `worker`/`cpus` can come later. | Worker mode is marked experimental upstream. Inline works without SharedArrayBuffer. |
| D9 | **Boot: a GRUB menu with both entries, shown only when `checkSupport().ok`.** Otherwise boot the JS kernel directly, with a `[ WARN ]` POST line. | User decision. JSPI needs Chrome/Edge 137+, Firefox 153+, Safari/iOS 27+. |
| D10 | **Keep the JS kernel forever** (`src/os/**`, `src/bin/**`). It's a boot entry, the fallback, and the host side of the bridge. | User decision (both kept). |
| D11 | **Apps reach Linux through unkernel's built-in host commands** (`createKernel({ commands })`, kwcmd on vsock port 1020), not a hand-rolled vsock protocol. | Found in the SDK types: each name becomes `/run/kw/bin/NAME` in the guest, and the host function gets `{ name, args, env, cwd, cols, rows, stdin, stdout, stderr, signal }` and returns the exit code. This is the "vsock display bridge" the user chose, already implemented. |
| D12 | **Bridged apps run as real processes of a headless JS kernel** (same VFS, same Compositor, same toolkits) with their stdio swapped for the guest's streams. App code (`src/bin/*.ts(x)`, `src/apps/**`) does not change. | It keeps every toolkit (React, `<template>`, web component, iframe) and `/proc`, and keeps the layout code untouched. |
| D13 | **The terminal inside a window is a web component `<vm-terminal>`** (light DOM; xterm CSS doesn't pierce shadow roots). | It adds to the mixed-technology layer rather than hiding inside React. |
| D14 | **GRUB default entry = JS kernel until PR 3 ships, then Linux.** The last choice is remembered in `localStorage`. | Linux without the bridge can't open the portfolio apps yet. |
| D15 | **GPL-2.0 notices ship with the binaries:** `LICENSE`, `THIRD-PARTY.md` and a source link for the kernel and image. | We redistribute `unkernel.wasm` (GPL-2.0) and Alpine/busybox. |

## Key entities

- **npm `unkernel@0.2.0-261124-c08e977`**: repo https://github.com/pithings/unkernel, license `MIT AND GPL-2.0-only`. Browser entry `unkernel/web` (the default export condition). Types: `node_modules/unkernel/dist/web.d.mts` and `dist/_chunks/index.d.mts`. **Read the types, not the README, when they disagree.**
- **Release assets** (tag `v0.2.0-261124-c08e977`): `alpine.erofs` 4,046,848 B, sha256 `bb9bed60c5d5418dc35b23ed69112882df7a7c5ae878490fc45a82fc5c28ffab`; `distros.json`; `unkernel.wasm` 11,440,861 B (also inside the npm package).
- **SDK surface we use:** `checkSupport()` → `{ ok, jspi, problems[] }`; `createKernel({ kernel, distro, memoryMiB, mounts, commands, disks, onProgress })` → `KernelHandle`; `vm.spawn(file?, args?, { cols, rows })` → pty `{ output: ReadableStream, write(), resize(), kill(), close(), ended }`; `vm.exec()`; `vm.stop()`; `vm.exited`; `openDistroDisk(url)`; `openDataDisk({...})` (IndexedDB); `MemoryFs`; `Fs` interface; `BlockDevice` interface; `HostCommand`/`HostCommandContext`; `F_RO`.
- **`distro` option accepts** "a path or URL (browsers: a URL, relative to the page), a disk spec, or a BlockDevice". Download mode passes a `BlockDevice` built over the downloaded bytes.
- **Guest users:** distro images run programs as `user` (uid 1000, `/home/user`, passwordless sudo). The base shell runs as root.

## Key files

| File | Steps |
|---|---|
| `package.json`, `package-lock.json` | 01, 02 |
| `vite.config.mjs` | 01 |
| `.gitignore` | 02 |
| `scripts/fetch-distro.mjs` (new) | 02, 04 |
| `src/os/unkernel/vm.ts` (new) | 01, 02, 08, 09 |
| `src/os/unkernel/image.ts` (new) | 02 |
| `src/terminal/themed-terminal.js` (new), `src/terminal/index.js` | 03, 06, 07 |
| `src/web-components/vm-terminal/vm-terminal.js` (new) | 04 |
| `src/bin/linux.ts` (new), `rootfs/usr/bin/linux` (new) | 04 |
| `src/boot/grub.ts` (new), `src/boot/linux.ts` (new) | 06, 07 |
| `src/os/unkernel/guest/` (new: motd, profile, help) | 08 |
| `src/os/tty/tty.ts`, `src/os/kernel/kernel.ts`, `src/os/kernel/syscalls.ts` | 09 |
| `src/os/tty/stream-tty.ts` (new), `src/os/unkernel/bridge.ts` (new) | 09, 10 |
| `tests/linux.spec.ts` (new), `tests/grub.spec.ts` (new), `tests/bridge.spec.ts` (new) | 05, 06, 10 |
| `README.md` | 05, 07, 10 |

## Commands

```sh
npm run dev            # Vite dev server (sets COOP/COEP itself; no service worker)
npm run build          # copy:coi + fredericton + vite build (step 02 adds fetch:distro)
npm run preview        # serves dist with NO isolation headers (like GitHub Pages before the SW)
npm run test:unit      # vitest + fredericton tests
npm run test:e2e       # playwright
npx tsc --noEmit       # type check
```

`npm run deploy` publishes `dist/` to `gh-pages`. **Only when the user asks.**

## Repo rules that apply

- Commits: no `Co-Authored-By` trailer, messages ≤ 80 chars, **never push unless asked**, and commit only when asked.
- README: no keys or secrets, and no implementation references unless a developer needs them.
- WCAG 2.2 AA always (see README): keyboard reachable, visible focus, names and states, reduced motion.
- No binary assets committed (D3).

## Known risks to check while executing

- **coi-serviceworker and Range:** the SW re-fetches each request and rebuilds the `Response`. Check that a Range request through it still returns 206 with `Content-Range` on a production build (`npm run build && npm run preview`, after the SW has activated). If it doesn't, patch the SW in `scripts/copy-coi.mjs` to pass `distros/` requests through untouched, as it already does for `fredericton/`.
- **Ctrl-C / Escape inside a `<vm-terminal>` window:** the compositor closes the window on Escape and sends SIGINT on Ctrl-C (`src/os/display/compositor.ts:125-134`) unless `e.defaultPrevented`. xterm normally cancels the keys it handles. Step 04 verifies this.
- **Playwright's Chromium needs JSPI** (Chrome 137+). `@playwright/test` 1.64 ships a newer Chromium, so this should hold. Specs still `test.skip` when `checkSupport().ok` is false.

## CHANGELOG

[CHANGELOG.md](CHANGELOG.md) in this folder. Every step appends its entry under `## [Unreleased]`. On shipping a PR, move that PR's entries under `## [YYYY-MM-DD]`. A step isn't done until its entry is written.
