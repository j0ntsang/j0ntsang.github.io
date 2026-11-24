# Step 03: extract themed xterm wiring (pure refactor)

PR 1 (Linux in a window). Prerequisites: none (independent of 01–02).

## Context

`src/terminal/index.js` builds the main xterm and wires everything that makes it fit the site: colors from CSS tokens (`--text-color`, `--background-color`, `--ansi-<name>` in `src/styles/themes.css`), a re-sync on `data-theme` changes and `transitionend`, cursor blink following the `animation` class on `<html>` (Settings → Animation, and `prefers-reduced-motion`), FitAddon with a debounced `ResizeObserver`, `screenReaderMode: true`, `minimumContrastRatio: 4.5` (WCAG), and links opening in a new tab.

Steps 04 and 07 need a second and a third xterm with the same behavior. Move it into one function. **No behavior change.** The boot code (keypress wait, `boot()`, `step()`) stays in `index.js`.

## Files

1. `src/terminal/themed-terminal.js` (new). Move these out of `index.js` unchanged: `ANSI_COLORS`, `animationEnabled`, `getColors`, the `Terminal` options, `syncTheme` and both `MutationObserver`s, the `transitionend` listener, `FitAddon` plus the debounced `ResizeObserver`, and the `.xterm-scrollable-element` background fix. Signature:
   ```js
   /**
    * An xterm.js terminal styled and sized like the rest of the site.
    * @param {HTMLElement} container
    * @returns {{ term: import("@xterm/xterm").Terminal, fit: () => void, dispose: () => void }}
    */
   export function createThemedTerminal(container) { ... }
   ```
   `dispose()` disconnects both MutationObservers and the ResizeObserver, removes the `transitionend` listener, and calls `term.dispose()`. The main terminal never disposes. Windows (step 04) do.
   Also move `import "@xterm/xterm/css/xterm.css";` here.

2. `src/terminal/index.js`: `startTerminal()` becomes container setup, then `const { term } = createThemedTerminal(container);`, then title handling (`terminal-title`, `onTitleChange`, `ignoredTitleSet`, `idlePromptTitle`), then the keypress wait and `boot(term)`, all exactly as now.

## Verify

1. `npm run test:e2e`: all green, especially `startup.spec.ts`, `settings.spec.ts` (theme and animation persistence) and `shell.spec.ts`.
2. Manual: switch themes in Settings and check that the terminal recolors. Toggle Animation and check the cursor blink follows. Resize the window and check the terminal refits.
3. `npx tsc --noEmit` clean.

## CHANGELOG entry

Under `### Changed`:
```
- Step 03: xterm theming, fit and blink wiring moved to src/terminal/themed-terminal.js (createThemedTerminal) for reuse; no behavior change.
```

## Checklist
- [ ] `index.js` has no theme or fit code left
- [ ] `dispose()` releases every observer and listener
- [ ] e2e green
- [ ] CHANGELOG updated
