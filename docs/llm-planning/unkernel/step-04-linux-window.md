# Step 04: `<vm-terminal>` web component and the `linux` program

PR 1 (Linux in a window). Prerequisites: steps 01, 02, 03 (`src/os/unkernel/vm.ts` with `bootLinux` and `resolveDistro`, `src/terminal/themed-terminal.js` with `createThemedTerminal`).

## Context

How programs work in the JS OS:
- An executable is a text file in `rootfs/` whose first line is `#!module:<name>`. The kernel lazy-loads `src/bin/<name>.ts(x)` (`import.meta.glob`, `src/os/kernel/kernel.ts:17`) and calls `default (argv, sys) => exitCode`. `#summary:` and `#usage:` lines feed `help`.
- `sys.createWindow({ title, maximized? })` returns a `Surface` `{ el, closed, onClose(fn), close(), setTitle() }`. The program draws into `surface.el` with any toolkit. Examples: `src/bin/october.tsx` (React, `mountReact`), `src/bin/fredericton.ts` (iframe, `mountFrame`).
- The compositor (`src/os/display/compositor.ts:125-134`) closes a window on **Escape** or **q** (when not typing) and sends **SIGINT on Ctrl-C**, unless the keydown was already `defaultPrevented`. xterm cancels the keys it handles, so it should win. Verify this below.
- `sys.signal` (an AbortSignal) fires on Ctrl-C/kill of the `linux` process itself.

This step adds a new toolkit-ish piece as a **web component** (index D13: light DOM, because xterm's CSS can't pierce a shadow root) and a program that boots Linux into it.

## Files

1. `src/web-components/vm-terminal/vm-terminal.js` (new):
   ```js
   // <vm-terminal> — an xterm attached to a pty of a running unkernel VM.
   //   el.attach(pty)  pipes pty.output → xterm and xterm input → pty, keeps the size in sync
   // Light DOM: xterm's stylesheet is global and can't reach into a shadow root.

   import { createThemedTerminal } from "../../terminal/themed-terminal";

   class VmTerminal extends HTMLElement {
     connectedCallback() {
       this.style.display = "block";
       this.style.height = "100%";
       if (!this.xt) this.xt = createThemedTerminal(this);
     }
     disconnectedCallback() {
       this.xt?.dispose();
       this.xt = null;
     }
     get term() { return this.xt.term; }

     /** @param {{ output: ReadableStream<Uint8Array>, write(d: string | Uint8Array): unknown, resize(c: number, r: number): unknown }} pty */
     attach(pty) {
       const { term, fit } = this.xt;
       fit();
       pty.resize(term.cols, term.rows);
       const subs = [term.onData((d) => pty.write(d)), term.onResize(({ cols, rows }) => pty.resize(cols, rows))];
       pty.output.pipeTo(new WritableStream({ write: (b) => term.write(b) })).catch(() => {});
       term.focus();
       return () => subs.forEach((s) => s.dispose());
     }
   }
   customElements.define("vm-terminal", VmTerminal);
   ```
   Check `vm.spawn`'s returned pty shape in `node_modules/unkernel/dist/_chunks/index.d.mts` (`interface Pty`). The README shows `output`, `write`, `resize`, `kill`, `close` and `ended`. Adjust if the types differ.

2. `src/bin/linux.ts` (new):
   ```ts
   // /usr/bin/linux — boot a real Linux kernel (unkernel, compiled to wasm) in a window.
   //
   //   linux                Alpine, image read lazily from this site
   //   linux --download     Alpine, downloaded whole first (then cached, works offline)
   //   linux --base         no distro: unkernel's busybox base shell
   //
   // Offline: the guest has no network. Close the window or `poweroff` to stop it.

   import "../web-components/vm-terminal/vm-terminal";
   import type { Sys } from "../os/kernel/syscalls";

   const USAGE = "usage: linux [--download | --base]\n";

   export default async function linux(argv: string[], sys: Sys) {
     const args = argv.slice(1);
     if (args.some((a) => a === "-h" || a === "--help")) return sys.write(USAGE), 0;
     const unknown = args.find((a) => !["--download", "--base"].includes(a));
     if (unknown) return sys.error(`linux: unknown option '${unknown}'\n${USAGE}`), 2;

     const { linuxSupport, bootLinux, resolveDistro } = await import("../os/unkernel/vm");
     const support = await linuxSupport();
     if (!support.ok) return sys.error(`linux: this browser can't run it:\n  ${support.problems.join("\n  ")}\n`), 1;

     const mode = args.includes("--base") ? "none" : args.includes("--download") ? "download" : "hosted";
     sys.write(`Booting Linux (${mode === "none" ? "base shell" : `Alpine, ${mode}`})...\n`);
     const distro = await resolveDistro(mode, "alpine", (d, t) => sys.write(`\r  image ${Math.floor((100 * d) / t)}%`));
     if (mode === "download") sys.write("\n");
     const vm = await bootLinux({ distro, onProgress: (s) => sys.write(`  ${s}\n`) });

     const surface = sys.createWindow({ title: "Linux", maximized: true });
     const el = document.createElement("vm-terminal") as HTMLElement & { attach(p: unknown): () => void; term: { cols: number; rows: number } };
     surface.el.append(el);
     const sh = await vm.spawn(undefined, [], { cols: el.term.cols, rows: el.term.rows });
     const detach = el.attach(sh);

     const stop = () => { detach(); void vm.stop?.(); };
     surface.onClose(stop);
     sys.signal.addEventListener("abort", () => surface.close());
     await Promise.race([sh.ended, surface.closed, vm.exited]);
     surface.close();
     return 0;
   }
   ```
   `sys` deliberately has no DOM access (`src/os/kernel/syscalls.ts` header). Drawing into `surface.el` is the sanctioned exception, the same as `mountReact`/`mountFrame`. Keep all DOM work on `surface.el`.

3. `rootfs/usr/bin/linux` (new):
   ```
   #!module:linux
   #summary: Boot a real Linux kernel (unkernel, in WebAssembly)
   #usage: linux [--download | --base]
   ```

4. GPL notices (index D15). Extend `scripts/fetch-distro.mjs` to also copy `node_modules/unkernel/LICENSE`, `LICENSE-MIT` and `THIRD-PARTY.md` into `public/distros/licenses/`. Add `rootfs/usr/share/doc/unkernel/README` (text, committed):
   ```
   unkernel — Linux compiled to WebAssembly. MIT AND GPL-2.0-only.
   Source: https://github.com/pithings/unkernel (tag v0.2.0-261124-c08e977)
   Alpine image built by that release; notices: /distros/licenses/ on this site.
   ```
   Then `cat /usr/share/doc/unkernel/README` works in the JS shell.

## Verify

1. `npm run dev`, then in the site shell:
   - `help` lists `linux`. `linux --help` prints usage. `linux --bogus` exits 2.
   - `linux`: a maximized window, Alpine login shell; `cat /etc/alpine-release` prints 3.24.x; `ls /` works; `vi` works (full-screen app, so the pty resize is right).
   - **Ctrl-C** inside the window interrupts the guest command (`sleep 100` then Ctrl-C) and **does not** close the window. **Escape** inside `vi` reaches vi. If the compositor steals either, add `WindowOptions.rawKeys?: boolean` to `src/os/display/compositor.ts` and skip both shortcuts when it's set (pass `rawKeys: true` from `linux.ts`). Document that in the CHANGELOG.
   - `poweroff` (or `exit`) closes the window and returns focus to the JS shell prompt.
   - The close button closes it, and `ps` no longer lists `linux`.
   - `linux --base` and `linux --download` both work. The second `--download` is instant (cached).
   - Theme switch recolors the Linux terminal too.
2. Lighthouse/axe on the window: no new violations. The xterm has `screenReaderMode` on.
3. tsc + unit + e2e green.

## CHANGELOG entry

Under `### Added`:
```
- Step 04: `linux` program: real Alpine Linux (unkernel) in a maximized window via the new <vm-terminal> web component; --download / --base; GPL notices shipped.
```

## Checklist
- [ ] Ctrl-C / Escape reach the guest
- [ ] Closing the window stops the VM; `poweroff` closes the window
- [ ] No unkernel code in main.js
- [ ] Notices present in dist/distros/licenses
- [ ] CHANGELOG updated
