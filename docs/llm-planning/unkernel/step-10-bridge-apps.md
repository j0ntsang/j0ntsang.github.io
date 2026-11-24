# Step 10: every portfolio app from the Linux shell; ship PR 3

PR 3. Prerequisites: step 09 (`src/os/unkernel/bridge.ts` `bridgeCommands(kernel, names)`, `StreamTty`, a headless JS kernel built in `src/boot/linux.ts`, with `about` bridged and working).

## Context

The JS OS's apps are the executables in `rootfs/usr/bin/` with a `#!module:<name>` first line: `about`, `codepen`, `fredericton`, `github`, `linkedin`, `october`, `resume`, `sysinfo`, `xdg-open`, and `linux` (from PR 1). `/bin` (`cat`, `ls`, `ps`, `sh`, …) are coreutils that Linux has its own versions of: **don't** bridge them.

Toolkits stay as they are (the point of the effort): `october` → React (`mountReact`), `fredericton` → iframe (`mountFrame`), `sysinfo` → React sidebar panel and a daemon (`spawn(..., { daemon: true })`, found again via `/proc`), and the window chrome is the `program-window` web component inside the `<window-manager>` web component.

Behaviors to get right:
- **Focus:** while a window is open, the compositor makes the `main` slot `inert`. When the last closes, it calls `onEmpty`, which must focus the **main xterm** (the NullTty's `focus` from step 09).
- **Blocking:** a guest `october` blocks until its window closes (the JS program awaits `surface.closed`). That's correct shell semantics. `october &` works through job control in the guest.
- **Ctrl-C:** inside the window, the compositor sends SIGINT to the JS pid, the program unwinds, and the guest process gets the exit code 130. In the main xterm while `october` is in the foreground, the guest pty sends SIGINT to kwcmd, `ctx.signal` aborts, and the bridge kills the JS pid, which closes the window.
- **Daemons:** `sysinfo start` spawns a `--daemon` child, which re-parents to the headless kernel's PID 1. The headless kernel has no init, so check `spawn(..., { daemon: true })` doesn't depend on a live PID 1 (`src/os/kernel/kernel.ts`). If it does, start a minimal idle init in the headless kernel: a `src/bin/init-headless.ts` that awaits forever, without printing a motd or spawning a shell.
- **`linux` inside Linux:** exclude it from the bridge (nested VMs are pointless and memory-heavy).

## Files

1. `src/os/unkernel/bridge.ts`: add
   ```ts
   /** The JS OS's apps: /usr/bin entries that are #!module: executables, minus `linux`. */
   export async function bridgedNames(vfs: Vfs): Promise<string[]>
   ```
   It reads `/usr/bin` through the VFS, keeps files whose first line matches `^#!module:`, and drops `linux`. The list then stays in sync when a program is added.
2. `src/boot/linux.ts`: `commands: bridgeCommands(jsKernel, await bridgedNames(vfs))`. Wire `compositor.onEmpty` → `term.focus()`.
3. `src/os/unkernel/guest/help` (from step 08): list the bridged apps with their `#summary:` lines. Better: generate the help text at boot from the same VFS headers and mount it, rather than keeping a static list.
4. `tests/bridge.spec.ts` (new, skips without JSPI, `?boot=linux`):
   - `october` opens the calendar window (same assertions as `october.spec.ts`'s open check). Escape closes it, the guest prompt returns, and `echo $?` is 0.
   - `fredericton` opens the iframe window (against the stand-in page as `fredericton.spec.ts` does).
   - `sysinfo start` shows the sidebar panel and returns the prompt. `sysinfo stop` collapses it.
   - `sleep 0; october` then Ctrl-C in the window → closed, and `echo $?` is 130.
   - After a window closes, typing goes to the guest shell (focus).
   - `about | head -1` works.
5. `src/boot/grub.ts`: the default entry becomes `"linux"` (index D14). Users who chose before keep their remembered choice.
6. `README.md` (user-facing): in section 4, add a short "Two kernels" paragraph. The boot menu offers the hand-built JavaScript OS or real Linux. In Linux, the same apps (`october`, `fredericton`, `sysinfo`, …) open as windows, because Linux runs them as host programs over a virtual socket. The JavaScript OS is what runs when the browser can't run Linux. Update "Startup order".
7. CHANGELOG: date all PR 3 entries.

## Verify
- `npm test` green (JS specs via `?boot=js`, bridge specs via `?boot=linux`).
- Manual, keyboard only: boot Linux, `october`, edit a day, Escape, `cat /srv/jontsang/...` unaffected (edits go to the JS overlayfs in localStorage, as before), reboot into the JS entry, and `october` shows the same edits. **One store of truth across both kernels.**
- Mobile width: the windows and sidebar behave as in the JS OS.
- WCAG: no new axe violations; focus is visible and returns correctly.
- Ask the user before committing or deploying.

## CHANGELOG entry

Under `### Added`:
```
- Step 10: all /usr/bin portfolio apps runnable from the Linux shell (bridged list read from #!module: headers); focus/Ctrl-C/daemon behavior; bridge e2e; GRUB defaults to Linux.
```

## Checklist
- [ ] Every app opens from Linux with its own toolkit unchanged
- [ ] The October edits are shared between both kernels
- [ ] GRUB default flipped to Linux; remembered choices respected
- [ ] README updated; PR 3 entries dated
