# Torn theme extension — build plan (not yet implemented)

This is a spec to build from later, not working code. Decided in conversation: no iframe (Torn sends `X-Frame-Options: SAMEORIGIN`; this portfolio's own `COEP: require-corp` would independently block it too — see `README.md`), no existing browser extension to reuse (the user's prior one was a proof of concept, no longer exists), so the plan is a new Manifest V3 Chrome extension with a content script on `torn.com`, built from the selectors already catalogued in `ui-map.md` and `layout-map.md`.

The portfolio's "Torn" app icon opens a styled `window.open()` popup to torn.com (separate top-level browsing context, not an iframe — necessary because of the SOP/XFO constraints above). This extension is what makes the reskin actually apply once that window loads; the popup and the extension are independent of each other.

## File layout (proposed)

```
torn-extension/
  manifest.json
  content.js
  content.css
  popup.html
  popup.js
  popup.css
  README.md        (load-unpacked install instructions)
```

## manifest.json

- `manifest_version: 3`
- `host_permissions: ["https://www.torn.com/*"]`
- `content_scripts`: matches `https://www.torn.com/*`, `css: ["content.css"]`, `js: ["content.js"]`, `run_at: "document_idle"` — letting Chrome's own CSS injection handle load timing avoids any manual-injection race/flash.
- `permissions: ["storage"]` for saving user settings (`chrome.storage.sync`), `["activeTab"]` for the popup to message the current tab.
- `action.default_popup: "popup.html"`.
- No `scripting` permission needed — the content script is declared statically, not injected programmatically.

## content.css — port of `theme.css`, driven by CSS custom properties with fallbacks

Same selectors as `theme.css` (legacy `.cont-gray`/`.box-title`, hashed-class substring matches for the React sidebar/header, `.crime-root` for Crimes pages), but every value reads `var(--torn-x, <fallback>)` instead of a fixed value, so sensible defaults render even before `content.js` finishes reading storage. Add one more rule not in the current `theme.css`:

```css
[data-panel-hidden="true"] { display: none !important; }
```

This is the hook the popup's show/hide checkboxes act through.

## content.js responsibilities

1. **Apply stored theme as CSS custom properties** on `document.documentElement.style` (`--torn-bg-color`, `--torn-panel-bg`, `--torn-font-family`, `--torn-font-size`, `--torn-link-color`) — read from `chrome.storage.sync`, falling back to the same defaults as `theme.css` when nothing is saved yet.
2. **Panel tagging pass** (the finding from `layout-map.md`: panels have no stable selector besides their `.box-title` text): a `tagPanels()` function that selects `#mainContainer .sortable-box:not([data-panel])`, reads each `.box-title` text (stripping trailing counts like ` (38)` via regex before slugifying, since that number is live data not part of the label), slugifies it (`working-stats`, `personal-perks`, …), and sets `data-panel="<slug>"` plus `data-panel-label="<original text>"` (kept for the popup to render human-readable labels without re-deriving them).
3. **`MutationObserver`** on `#mainContainer` (childList + subtree, debounced via `requestAnimationFrame`) that re-runs `tagPanels()` as panels render/re-render — necessary because Torn's dashboard is React-driven and panels can mount after initial page load, and because the panel set is account/state-driven per `layout-map.md` (can change without a full page reload, e.g. after joining a faction).
4. **Apply hidden-panel state**: read `hiddenPanels` map (`{ "working-stats": true, ... }`) from storage, set `data-panel-hidden="true"` on matching tagged panels, re-applied by the same observer pass so newly-tagged panels pick up existing hide state immediately.
5. **`chrome.storage.onChanged` listener** — live-updates theme variables and hidden-panel state when the popup changes a setting, no reload required.
6. **`chrome.runtime.onMessage` listener** — responds to a `{type: "GET_PANELS"}` request from the popup with the current list of tagged panels (`[{slug, label}]`), so the popup can render an up-to-date show/hide checklist for whatever page is currently open, rather than hardcoding the 13 Home-page panels (which, per `layout-map.md`, aren't guaranteed to be the same on every account or every page).

## popup.html / popup.js / popup.css

Controls:
- Background color picker (→ `--torn-bg-color`)
- Panel background color picker (→ `--torn-panel-bg`)
- Link color picker (→ `--torn-link-color`)
- Font family `<select>` — coding-friendly system/web-safe options: JetBrains Mono, Fira Code, Cascadia Code, Source Code Pro, IBM Plex Mono, and a plain `ui-monospace, Menlo, Consolas, monospace` system-stack fallback that needs no web font at all
- Font size number input (→ `--torn-font-size`)
- **Panel checklist**: on popup open, query the active tab (`chrome.tabs.query({active: true, currentWindow: true})`), confirm its URL is on `torn.com`, then `chrome.tabs.sendMessage(tab.id, {type: "GET_PANELS"})` to fetch the live panel list and render one checkbox per `{slug, label}`, checked state driven by the stored `hiddenPanels` map (inverted — checked = visible). Toggling writes back to `chrome.storage.sync`, which `content.js`'s `onChanged` listener picks up immediately on the open tab.

All settings persist via `chrome.storage.sync` under two keys: `theme` (the five properties above) and `hiddenPanels` (slug → boolean).

## Known gaps to resolve during implementation, not before

- Font-family override must win against both font stacks found in `ui-map.md` (plain `Arial` on legacy pages, `"Fjalla One"` on Crimes SPA pages) — the existing `body.body, body.body *` universal-selector approach in `theme.css` already handles this; carry it over as-is.
- Panel tagging only covers the Home dashboard (`#mainContainer .sortable-box`) for now — Crimes/Item Market internals would need their own tagging pass if show/hide is wanted there too, following the same text-match-then-stamp pattern, once those sections are individually mapped.
