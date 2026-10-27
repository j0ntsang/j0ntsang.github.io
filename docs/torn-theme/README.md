# Torn.com portfolio app — status

Goal: embed Torn.com in a window inside the portfolio OS, let the user log in, and apply a custom theme/layout (background color, font, font size, show/hide or regroup UI sections) via injected CSS/DOM changes — not via Torn's own API (that path was explored and set aside; see conversation history if needed, not captured in these docs).

## Decisions made

- **Iframe embedding of the real torn.com is not possible**: Torn sends `X-Frame-Options: SAMEORIGIN`, and separately this portfolio site forces `COEP: require-corp` site-wide (via `coi-serviceworker.js`, since GitHub Pages can't set custom response headers) — either one alone blocks it. No workaround exists client-side. A server-side reverse proxy could theoretically strip the header, but GH Pages can't host one, and proxying an authenticated session likely violates Torn's ToS — not pursued.
- Torn has **no native skin/custom-CSS setting** (checked `/preferences.php` fully) — any visual reskinning must be injected externally.
- Inspection tool: **Claude in Chrome** MCP (`mcp__claude-in-chrome__*`), attached to the user's own logged-in Chrome session, used strictly read-only (DOM inspection, screenshots, no clicks on anything that performs a game action, no form submission) to avoid any ToS risk around automation.
- A test `<style>` override was injected live into the real session and verified working (font, size, link color, panel backgrounds), then removed — confirmed the approach is technically sound.

## Files in this folder

- **`ui-map.md`** — CSS/selector reference: stable containers, the legacy-vs-React-CSS-Modules distinction (hashed classnames rotate on deploy, use substring `[class*="prefix___"]` selectors), typography per page type, per-page findings (Home, Settings, Crimes/Card Skimming, Item Market).
- **`layout-map.md`** — structural/categorical inventory: Home's 13 dashboard panels, sidebar nav, header nav, and the finding that panel presence is account/state-driven (not a fixed list) with no stable selector beyond `.box-title` text — a lookup must be run live, not hardcoded.
- **`theme.css`** — the actual theming layer (CSS custom properties for bg color, font family/size), verified live against the real site.
- **`extension-plan.md`** — full build spec for the delivery mechanism (see "Delivery mechanism" below): file layout, manifest, content script responsibilities, popup UI, storage schema. Not yet implemented — plan only.

## Delivery mechanism: decided, not yet built

Iframe embedding is ruled out (see "Decisions made" above). Since the user no longer has their prior Chrome extension (it was a proof of concept, not kept), the plan is a **new Manifest V3 Chrome extension** with a content script on `torn.com` that applies `theme.css` and the panel-tagging logic — detailed in `extension-plan.md`. The portfolio's "Torn" app icon will open torn.com in a styled `window.open()` popup (not an iframe — required by the SOP/XFO constraints); the extension is what makes the reskin apply once that window loads, independent of how the tab was opened.

## Not yet done (next steps)

1. **Build the extension** per `extension-plan.md` — currently just a spec, no code written (`manifest.json`, `content.js`, `content.css`, `popup.*` all TBD).
2. **`data-panel` tagging logic**: specified in `extension-plan.md` as part of `content.js`, not yet written as actual code.
3. **Portfolio-side launcher**: no `src/bin/torn.tsx` or app component written yet — the `window.open()` popup launcher is still just a plan.
4. Sections not yet inspected: Education, Travel Agency, Friends/Targets list pages, other Crimes sub-activities beyond Card Skimming, whether Property Vault is a separate page or a tab within Properties.
