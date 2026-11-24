# Step 05: PR 1 tests, README, ship

PR 1 (Linux in a window). Prerequisites: steps 01–04.

## Context

The Playwright specs live in `tests/` (`shell.spec.ts`, `october.spec.ts`, `fredericton.spec.ts`, …) with shared helpers in `tests/helpers.ts`. Read `helpers.ts` first: it has the boot and run-command helpers the other specs use. Reuse them rather than writing new ones.

The `linux` program (step 04) opens a maximized `program-window` holding a `<vm-terminal>`. unkernel needs JSPI. If the Playwright browser lacks it, the program prints "this browser can't run it" and exits 1.

## Files

1. `tests/linux.spec.ts` (new). Cases:
   - **skip guard:** in `beforeEach`, evaluate `typeof WebAssembly.Suspending === "function"` and `test.skip` with a reason when it's false.
   - `linux --base` boots: the window appears (role/name as other window specs check), and typing `uname -s` + Enter shows `Linux` in the window's xterm rows (`.xterm-rows` text). Timeout ~60s, because an 11 MB wasm load over the dev server can be slow on CI.
   - `linux` (hosted Alpine) shows `3.24` for `cat /etc/alpine-release`.
   - Ctrl-C in the window doesn't close it. `poweroff` closes it, and focus returns to the main terminal (the JS prompt accepts `pwd`).
   - `linux --bogus` prints usage and exits 2 (check the JS shell's `$?`-style output the way `shell.spec.ts` does).
   - Unsupported browser path: stub `WebAssembly.Suspending` away with `page.addInitScript`, run `linux`, and expect the "can't run it" message.
2. `tests/prod.spec.ts`: add one assertion that the production build serves `distros/alpine.erofs` with a 206 for a Range request. Follow how that spec already reaches the built site.
3. `README.md`: add a short section after the `fredericton` paragraph in "4. xterm.js + a small OS". It should be user-facing and free of implementation detail (repo rule), with only what a developer needs:
   ```md
   **`linux`** — boots a real Linux kernel ([unkernel](https://github.com/pithings/unkernel), Linux compiled to WebAssembly) with Alpine in a window. It runs entirely in the browser with no network. `linux --download` fetches the image once and keeps it for offline use; `linux --base` skips the image for unkernel's busybox shell. Needs a browser with JSPI (Chrome/Edge 137+, Firefox 153+, Safari 27+). The image isn't committed: `npm run fetch:distro` (run by `dev` and `build`) downloads and checks it.
   ```
   Add `unkernel` to the Runtime Dependencies table: `| unkernel | Linux kernel compiled to WebAssembly; loaded only when Linux boots |`.
   Update the `coi-serviceworker` row: SharedArrayBuffer isn't required by the current inline mode, so say "cross-origin isolation for COEP-dependent features".
4. Move PR 1's CHANGELOG entries under `## [YYYY-MM-DD]` (the ship date).

## Verify

- `npm test`: unit + e2e green (the linux spec runs or skips with a reason).
- `npm run build && npm run preview`: run `linux` on the preview build after the SW reload.
- Ask the user before committing. Commit messages ≤ 80 chars, no co-author trailer, no push unless asked.

## CHANGELOG entry

Under `### Added`:
```
- Step 05: tests/linux.spec.ts (skips without JSPI), prod Range check, README section for `linux`.
```

## Checklist
- [ ] Specs green (or skipped with a reason) locally
- [ ] README updated, with no implementation references beyond what developers need
- [ ] PR 1 entries dated in CHANGELOG
