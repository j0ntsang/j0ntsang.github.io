# Step 09: host-command bridge: guest runs a JS-kernel program

PR 3 (App bridge). Prerequisites: PR 2 shipped (steps 06–08). The Linux entry boots from `src/boot/linux.ts` via `bootLinux()` in `src/os/unkernel/vm.ts`.

## Context

Goal (index D11, D12): typing `october` in the **Linux** shell opens the same React October window, through the same compositor, as in the JS OS. App code doesn't change.

**unkernel already has the bridge.** `createKernel({ commands: { name: handler } })`: for each name the guest gets `/run/kw/bin/NAME` (a kwbox link that runs kwcmd, which connects to the host over vsock port 1020, `CMD_PORT`). Running it calls the host function once per guest process with a `HostCommandContext`:
```ts
{ name, args, env, cwd, pid, uid, gid, isTTY: { stdin, stdout, stderr }, cols, rows,
  stdin: ReadableStream<Uint8Array>,          // pull: each read here = one guest read (≤16 KiB)
  stdout: WritableStream<Uint8Array | string>,  // resolves once the guest took it
  stderr: WritableStream<Uint8Array | string>,
  signal: AbortSignal }                        // guest process gone (Ctrl-C, kill, closed pipe, VM exit)
```
The return value ends the guest process: a number is the exit code, `{ signal: "SIGINT" }` kills it with that signal, and a throw prints to stderr and exits 1. `PATH` gets `/run/kw/bin` first via the profile from step 08.

**How the JS kernel gives programs I/O today:** `Kernel` (`src/os/kernel/kernel.ts`) is constructed with `(vfs, tty, compositor)`, and `syscalls(ctl)` (around line 118) builds each program's `Sys`: `write`/`error` → `tty.write`, `readLine` → `tty.readLine`, `columns` → `tty.columns`, `createWindow` → `this.display.createWindow(pid, …)`. `kernel.kill(pid, sig)` aborts `ctl.abort` and exits with 128+n. `display.onEmpty = () => tty.focus()`.

Plan: let a process carry **its own terminal**, implemented over the guest streams, and run bridged programs in a **headless JS kernel** that shares the VFS and the Compositor.

## Files

1. `src/os/tty/tty.ts`: extract the interface the kernel uses:
   ```ts
   export interface TtyDevice {
     write(s: string): void;
     readLine(prompt: string, complete?: Completer): Promise<string | null>;
     readonly columns: number;
     focus(): void;
   }
   ```
   `class Tty implements TtyDevice`. Rename only the type use sites in `kernel.ts`. No behavior change.

2. `src/os/tty/stream-tty.ts` (new): `TtyDevice` over a `HostCommandContext`:
   - `write(s)`: queue onto one `ctx.stdout.getWriter()` (preserve order; fire-and-forget with `.catch(() => {})`). Translate nothing: the guest pty does ONLCR.
   - `readLine(prompt)`: write the prompt, then read `ctx.stdin` chunks until `\n` (keep the remainder for the next call); EOF → `null`. Line editing is the guest pty's canonical mode, so no `local-echo`.
   - `columns`: `ctx.cols || 80`. `focus()`: no-op (the main xterm owns focus; see step 10).
   - `close()`: release the writer.

3. `src/os/kernel/kernel.ts`:
   - `SpawnOptions` (`src/os/kernel/syscalls.ts`) gains `tty?: TtyDevice` (internal, not part of `Sys`).
   - `ProcessControl` stores its tty. `syscalls(ctl)` uses `ctl.tty ?? this.tty`. A child inherits its parent's tty unless overridden.
   - Add `kernel.run(path, argv, opts)`: like `spawn` with a `null` parent (env defaults), returning the exit code. Use the existing `spawn` if it already fits.

4. `src/os/unkernel/bridge.ts` (new):
   ```ts
   // os/unkernel/bridge — Linux runs this OS's programs as host commands.
   // Each guest `october …` becomes a process of a headless JS kernel (same VFS, same
   // compositor, same toolkits) whose terminal is the guest process's stdio.
   import type { HostCommand, HostCommandContext } from "unkernel";
   export function bridgeCommands(kernel: Kernel, names: string[]): Record<string, HostCommand> {
     return Object.fromEntries(names.map((name) => [name, async (ctx: HostCommandContext) => {
       const tty = new StreamTty(ctx);
       const run = kernel.run(`/usr/bin/${name}`, [name, ...ctx.args], { tty, foreground: false });
       const onAbort = () => kernel.killByTty(tty, "SIGINT");     // or keep the pid from run
       ctx.signal.addEventListener("abort", onAbort, { once: true });
       try { return await run; } finally { ctx.signal.removeEventListener("abort", onAbort); tty.close(); }
     }]));
   }
   ```
   The kill path needs the pid. Have `kernel.run` accept an `onPid` callback, or return `{ pid, exited }`. Pick whichever matches `spawn`'s shape once you've read it.

5. `src/boot/linux.ts`: before `bootLinux`, build a headless JS kernel exactly as `src/os/boot.ts` mounts it (rootfs `/`, overlayfs `/home` and `/var`, procfs `/proc`) **without starting `/sbin/init`**. Construct it with `new Compositor(windowLayer, windowManager)` and a `NullTty` (write → `console.debug`, readLine → `null`, focus → the main xterm's `term.focus()`). Factor the mounting part of `src/os/boot.ts` into `mountFilesystems(vfs, kernel)` so both paths share it. Pass `commands: bridgeCommands(jsKernel, ["about"])` into `bootLinux` (add `commands` to `BootOptions`). **Only `about` in this step**: a text-only program, which proves stdio before windows.

## Verify
- `?boot=linux`, then `about`: prints the same text as in the JS shell, `echo $?` is 0, and `about | wc -l` works (pipe, so `isTTY.stdout` is false).
- `which about` → `/run/kw/bin/about`.
- A unit test (vitest) for `StreamTty` with fake streams: write ordering, `readLine` across chunk boundaries, EOF → null.
- The JS boot path is unchanged: `npm test` green.

## CHANGELOG entry

Under `### Added`:
```
- Step 09: per-process TTY device in the JS kernel (StreamTty over guest stdio); headless JS kernel beside the VM; unkernel `commands` bridge proven with `about`.
```

## Checklist
- [ ] The `Tty` interface extraction doesn't change JS-shell behavior
- [ ] `about` works from Linux, including in a pipe
- [ ] StreamTty unit-tested
- [ ] CHANGELOG updated
