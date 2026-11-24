# Step 06: GRUB boot menu (gated on `checkSupport`)

PR 2 (GRUB + Linux as main terminal). Prerequisites: PR 1 shipped (steps 01–05).

## Context

Today `src/terminal/index.js` does: build xterm (via `createThemedTerminal` since step 03) → write "Press any key to boot..." → on a key, `boot(term)`, which runs POST `step()`s (label, 150–400 ms pause, `[  OK  ]`/`[ WARN ]`/`[ FAIL ]`) and then `bootKernel(term, step)` from `src/os/boot.ts` (mount rootfs/overlayfs/procfs, start `/sbin/init`).

User decisions (index D9, D10, D14):
- After the keypress, check `checkSupport()` (from unkernel, via `linuxSupport()` in `src/os/unkernel/vm.ts`). Note that this imports the unkernel chunk (JS only, small), **not** the 11 MB wasm. Confirm in the Network tab that the `.wasm` isn't fetched.
- `ok` → show a GRUB-style menu with two entries. Otherwise boot the JS kernel directly, after a `[ WARN ]` line naming the first problem.
- The default entry is the JS kernel until PR 3 ships. The last choice is remembered.

## Design

```
 GNU GRUB-ish  version 2.12-jontsang

 ┌──────────────────────────────────────────────────────┐
 │*jontsang-os (JavaScript kernel)                      │
 │ Linux 7.x (unkernel, Alpine) — offline               │
 └──────────────────────────────────────────────────────┘
   Use ↑ and ↓ to select, Enter to boot.
   The highlighted entry boots automatically in 5s.
```
- Drawn with ANSI in the existing xterm (no DOM): reverse video for the highlight, using theme colors.
- Keys: ↑/↓ or `k`/`j` move and cancel the countdown. Enter boots. Number keys `1`/`2` pick and boot.
- 5 s countdown. **No countdown when animation is off** (`<html>` lacks the `animation` class, as with reduced motion), so the menu waits for Enter. Moving text is motion, and a timeout surprises screen-reader users (WCAG 2.2.1 Timing Adjustable).
- `screenReaderMode` is already on. Each redraw writes the full line text, so the selected entry is announced.
- `localStorage["boot.entry"]` = `"js" | "linux"` (wrap in try/catch, as `settingsMenu.ts` does).
- URL override `?boot=js|linux` skips the menu (for tests and links).

## Files

1. `src/boot/grub.ts` (new):
   ```ts
   export type BootEntry = "js" | "linux";
   export interface GrubOptions { defaultEntry: BootEntry; timeoutSec: number | null }
   /** Draw the menu in the terminal and resolve with the chosen entry. */
   export function grubMenu(term: Terminal, opts: GrubOptions): Promise<BootEntry>;
   export function rememberedEntry(fallback: BootEntry): BootEntry;   // localStorage, with ?boot= winning
   export function rememberEntry(e: BootEntry): void;
   ```
   Implementation: one `term.onData` subscription disposed on resolve; redraw = `\x1b[H\x1b[2J` + lines; key codes `\x1b[A`/`\x1b[B`/`\r`.

2. `src/terminal/index.js`: after the keypress, replace the direct `boot(term)` with:
   ```js
   const entry = await chooseEntry(term);   // support check + menu, or "js"
   if (entry === "linux") await bootLinuxEntry(term);  // step 07; until then, fall back to boot(term)
   else await boot(term);
   ```
   `chooseEntry`:
   - `const { linuxSupport } = await import("../os/unkernel/vm");` inside try/catch (a chunk-load failure counts as unsupported).
   - unsupported → print `[ WARN ] Linux unavailable: <first problem>` and return `"js"`.
   - else `grubMenu(term, { defaultEntry: rememberedEntry("js"), timeoutSec: animationEnabled() ? 5 : null })`, then `rememberEntry(choice)`.
   For this step, `linux` boots `boot(term)` and then auto-runs nothing. Step 07 fills in `bootLinuxEntry`. Until then make the Linux entry visibly disabled ("(coming soon)") so the step ships coherent behavior.

3. `tests/grub.spec.ts` (new):
   - Supported browser: after the keypress the menu shows both entries. ↓ + Enter selects Linux (assert on the entry's state for now). The choice persists across a reload.
   - `?boot=js` skips the menu and reaches the JS prompt (existing specs should pass `?boot=js`; update `tests/helpers.ts`'s page-open helper to add it so they keep testing the JS OS).
   - Unsupported (init script removes `WebAssembly.Suspending`): no menu, a WARN line, the JS prompt.
   - Animation off: no countdown text, and still waiting after 6 s.

## Verify
- `npm test` green: every existing spec still reaches the JS shell via the helper's `?boot=js`.
- The Network tab on the menu shows no `.wasm` fetched.
- Keyboard-only run-through. The screen reader (VoiceOver) announces the highlighted entry.

## CHANGELOG entry

Under `### Added`:
```
- Step 06: GRUB-style boot menu (JS kernel / Linux), shown only when unkernel's checkSupport() passes; remembered choice; ?boot= override; no countdown without animation.
```

## Checklist
- [ ] The menu never shows on unsupported browsers
- [ ] No timeout when animation is off
- [ ] Existing specs pinned to `?boot=js`
- [ ] CHANGELOG updated
