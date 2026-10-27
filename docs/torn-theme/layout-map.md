# Torn.com layout & section catalog

Purpose: a categorical inventory of every *labeled* UI section across the pages mapped so far, so they can be grouped, tabbed, or shown/hidden as a custom layout. Captured read-only (DOM inspection only — no clicks on anything that performs a game action, no form submission) from `index.php` while logged in, 2026-10-26.

## Important: panels have no stable per-section selector — only a label

Each Home dashboard panel's only unique identifier is a **numeric `id` that's generated per account/session** (e.g. `id="item21764414"`) — it is not a fixed id you can hardcode (it will differ on your account, and may change over time). There is also no `data-*` attribute naming what the panel *is*. The only thing identifying a panel's purpose is the **visible text inside its `.box-title`** (e.g. "Working Stats").

**Implication**: pure CSS (`:nth-child`, attribute selectors, etc.) cannot reliably target "the Working Stats panel" — CSS has no text-matching selector. A show/hide or regrouping layer needs a small one-time JS pass that walks `.sortable-box` elements, reads each `.box-title` text, and stamps a stable marker (e.g. `data-panel="working-stats"`) onto the box — *after that*, CSS/JS can freely show, hide, reorder, or re-parent panels by that marker. This JS pass only reads text and sets an attribute; it doesn't click or submit anything, so it carries the same low footprint as the rest of this inspection.

## Panel set is account/state-driven, not a fixed universal list

Re-confirmed via a fresh read-only text lookup (`.box-title` text content, no clicks) — still exactly 13 panels, same labels, consistent with the first pass. But this list is **this account's current set**, not a fixed template every account gets: Torn's dashboard already does its own backend-driven customization (e.g. "Faction Information" only appears if you're in a faction; panels likely come and go based on game state/unlocks rather than a manual add/remove menu).

Checked the per-panel header controls to see if there's a "catalog of all available panels" UI to enumerate (read-only — inspected `aria-label`/attributes, did not click):
- The icon that looked like "+" in the screenshot is actually `aria-label="Close Working Stats panel"` — a **collapse/close toggle**, not an "add a new panel" menu.
- There's also a drag-handle icon (`accordion-header-move`) confirming these are Torn's own reorderable widgets.
- No separate "add panel" control was found attached to the panel headers. So there's no in-game settings screen to diff against — **the only reliable way to know what's on a given account is this same text lookup, run per-account**, not a static reference list this doc can assume holds everywhere.

**Practical implication**: any layout/show-hide tool built from this catalog should re-run the `.box-title` text lookup at runtime (same one-liner as above) rather than hardcoding "there are always these 13 panels" — the real set will vary by account state (faction membership, education/perks unlocked, etc.).

## Home page (`index.php`) — 13 dashboard panels (as currently configured on this account)

All are `.sortable-box` elements (Torn's own "drag to reorder" widgets — so the game already treats these as independently movable units, which works in our favor for a custom layout). Suggested `data-panel` slugs in parentheses:

| Label (exact `.box-title` text) | Suggested slug |
|---|---|
| Job Information | `job-info` |
| General Information | `general-info` |
| Battle Stats | `battle-stats` |
| Working Stats | `working-stats` |
| Personal Perks (38) *(number varies)* | `personal-perks` |
| Skill Levels | `skill-levels` |
| Equipped Weapons & Armor | `equipped-gear` |
| Property Information | `property-info` |
| Faction Information | `faction-info` |
| Criminal Record | `criminal-record` |
| Latest Messages | `latest-messages` |
| Latest Attacks | `latest-attacks` |
| Latest Events | `latest-events` |

Note "Personal Perks (38)" — the count is live data baked into the label text; match on a prefix (`startsWith('Personal Perks')`) rather than an exact string.

## Global sidebar nav ("Areas") — top-level category links, present on every page

These aren't content panels, they're persistent navigation — but they're exactly the kind of labeled, categorical list the user asked about, and a natural source for a custom tab bar if the goal is "jump between sections" rather than "see everything on one screen."

| Label | Route | Notes |
|---|---|---|
| Home | `/index.php` | server-rendered, dashboard panels above |
| City | `/city.php` | server-rendered |
| Hospital | `/hospitalview.php` | server-rendered |
| Crimes | `/crimes.php` → sub-crimes at `/page.php#/<crime>` | hub is server-rendered, each crime is a React SPA route |
| Missions | `/page.php` (hash route) | **not** `/missions.php` directly — confirmed this is why that URL 404'd earlier; it's SPA-only, reachable only via in-app navigation or a `#/missions`-style hash, not a bare `.php` entry point |
| Job | `/jobs.php` | server-rendered |
| Item Market | `/page.php` (hash route `#/market/...`) | React SPA, Headless UI (see ui-map.md) |
| Items | `/item.php` | server-rendered |
| Education | `/page.php` (hash route) | React SPA, not individually inspected yet |
| Gym | `/gym.php` | server-rendered |
| Newspaper | `/newspaper.php` | server-rendered |
| Bounties | `/bounties.php` | server-rendered |
| Properties | `/properties.php` | server-rendered |
| Property Vault | `/properties.php` | shares route with Properties (likely a tab within the page, not a separate one) |
| Estate Agents | `/estateagents.php` | server-rendered |
| Travel Agency | `/page.php` (hash route) | React SPA |
| Settings | `/preferences.php` | server-rendered, confirmed no skin option (see ui-map.md) |

Plus a **Lists** sub-section: Friends, Targets (both React SPA, `/page.php` hash routes), and a global online-user-count link (`/usersonline.php`).

## Header top bar — secondary nav, same on every page

Wiki, Rules, Forums, Discord, Staff, Credits — external/informational links, plus an account menu (View Profile, Settings, Logout) under the "User" dropdown.

## How this maps to "groupable / tabbable / show-or-hide"

Three distinct layout tiers emerged, worth treating separately rather than one flat list:

1. **Home dashboard panels** — already individually targetable (after the `data-panel` tagging pass above) and already drag-reorderable by Torn itself. Best candidate for a user-customizable grid/show-hide UI, since the content lives in one page and nothing needs cross-page navigation.
2. **Sidebar "Areas"** — these are navigation, not content; "grouping" them means building a custom tab bar/launcher that jumps between routes, not rearranging content in place. A different interaction model from #1.
3. **Per-section SPA internals** (Crimes options, Item Market tiles, etc.) — finer-grained than the above; each would need its own mapping pass like the Card Skimming one in `ui-map.md` before subdividing further.

## Still to inventory before this catalog is "complete"

- Education, Travel Agency, Friends/Targets lists — not yet opened (deferred per "don't click more than needed" — can inspect on request).
- Whether Property Vault is really a tab inside `/properties.php` or a separate panel (same route was returned for both links, consistent with a tabbed single page, not confirmed by viewing the page itself).
