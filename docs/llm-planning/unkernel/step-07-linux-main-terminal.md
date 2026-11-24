# Step 07: Linux boot path in the main terminal

PR 2. Prerequisites: step 06 (the GRUB menu exists, and the Linux entry is a disabled placeholder that calls `bootLinuxEntry(term)` in `src/terminal/index.js`).

## Context

- The main xterm is created in `src/terminal/index.js` with `createThemedTerminal` (step 03). The title bar text follows OSC 0 titles (`term.onTitleChange`), and prompt-shaped titles are ignored for `document.title`.
- The JS path uses `Tty` + `local-echo` for line editing. **The Linux path doesn't**: the guest pty does its own line discipline, so xterm talks to the pty directly, exactly like `<vm-terminal>.attach(pty)` in `src/web-components/vm-terminal/vm-terminal.js` (step 04).
- POST lines come from the `step(label, fn, { fatal })` helper inside `boot()` in `index.js`. Reuse it so the Linux boot looks the same.
- SDK (see `src/os/unkernel/vm.ts`): `bootLinux({ distro, onProgress })`, `resolveDistro(mode, "alpine", onBytes)`, `vm.spawn(undefined, [], { cols, rows })` → login shell pty with `ended`.
- The image mode for the main terminal is `hosted` by default, `download` via `?image=download` (index D2).

## Files

1. `src/terminal/index.js`: hoist `step` out of `boot()` into a module-level `makeStep(term)` so both paths share it. Change nothing else in the JS path.

2. `src/boot/linux.ts` (new):
   ```ts
   // boot/linux — the GRUB menu's Linux entry: unkernel in the main terminal.
   import type { Terminal } from "@xterm/xterm";
   type Step = (label: string, fn: () => Promise<void>, o?: { fatal?: boolean }) => Promise<void>;

   export async function bootLinuxEntry(term: Terminal, step: Step) {
     const { bootLinux, resolveDistro } = await import("../os/unkernel/vm");
     const mode = new URLSearchParams(location.search).get("image") === "download" ? "download" : "hosted";
     let distro: Awaited<ReturnType<typeof resolveDistro>>;
     await step(`Loading Alpine image (${mode})`, async () => {
       distro = await resolveDistro(mode, "alpine", (d, t) => term.write(`\x1b]0;image ${Math.floor((100 * d) / t)}%\x07`));
     });
     let vm!: Awaited<ReturnType<typeof bootLinux>>;
     await step("Loading kernel (unkernel.wasm)", async () => { vm = await bootLinux({ distro }); });
     // Respawn a login shell forever, like src/bin/init.ts does for the JS shell
     // (with the same "respawning too fast" guard: 5 quick exits → stop and say so).
     for (;;) {
       term.write("\x1b[2J\x1b[H");
       const sh = await vm.spawn(undefined, [], { cols: term.cols, rows: term.rows });
       const subs = [term.onData((d) => sh.write(d)), term.onResize(({ cols, rows }) => sh.resize(cols, rows))];
       await sh.output.pipeTo(new WritableStream({ write: (b) => term.write(b) })).catch(() => {});
       await sh.ended;
       subs.forEach((s) => s.dispose());
     }
   }
   ```
   Add the quick-exit guard from `src/bin/init.ts` (`QUICK_EXIT_MS = 1000`, `MAX_QUICK_EXITS = 5`). Handle `vm.exited` (`poweroff`/`reboot`): print `System halted. Press any key to return to the boot menu.` and on a key `location.reload()`.

3. `src/terminal/index.js`: wire the GRUB Linux entry to `bootLinuxEntry(term, makeStep(term))` and remove the "(coming soon)" disabled state from step 06 in `src/boot/grub.ts`. If the Linux boot throws, print the error like a FAIL step and offer "Press any key to boot the JavaScript kernel instead". On a key, run the JS `boot(term)`.

4. `README.md`: update the "Startup order" paragraph in section 5 to mention the menu and both entries (user-facing).

## Verify
- `?boot=linux`: POST lines appear, then the Alpine prompt in the main terminal. `vi`, `top` and Ctrl-C behave. Resizing the browser resizes the guest (`stty size` changes).
- `exit` → a fresh login shell. `poweroff` → the halted message → a key → back to the menu.
- `?boot=linux&image=download`: progress in the title bar, then the second load comes from cache.
- The theme switch recolors. The sidebar/settings/fullscreen chrome still works (they're independent of the kernel).
- Add a `tests/grub.spec.ts` case: Linux entry → `cat /etc/alpine-release` shows 3.24 (skips without JSPI).
- `npm test` green.

## CHANGELOG entry

Under `### Added`:
```
- Step 07: GRUB Linux entry boots unkernel in the main terminal (shared POST steps, login shell respawn, halt → back to menu, ?image=download).
```

## Checklist
- [ ] The JS path is byte-for-byte the same behavior
- [ ] A Linux failure falls back to the JS kernel on a key
- [ ] CHANGELOG updated
