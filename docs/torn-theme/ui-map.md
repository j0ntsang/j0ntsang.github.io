# Torn.com UI element map

Captured live from a logged-in session (Home page, `index.php`, plus `preferences.php`) via Claude in Chrome DevTools inspection, 2026-10-26. Torn ships two very different DOM/CSS styles on the same page — this matters for how reliable each selector is.

## Two DOM worlds on one page

1. **Legacy server-rendered skin** (dashboard panels, tables, most of `#mainContainer`): plain, semantic, hand-written class names. **Stable** — these are the same classes the old-school "Torn skins" community has targeted for years.
2. **Modern React components** (sidebar, chat, header dropdowns): CSS Modules with hashed suffixes, e.g. `sidebar___c4dEc`, `header___IXOC8`, `effectRoot___IiOap`. **The hash rotates on every Torn frontend deploy.** Never hardcode the full class — match on the stable prefix before `___` with an attribute selector instead (see "Targeting the hashed React classes" below).

## Stable top-level containers (IDs — safest anchors)

| ID | What it is |
|---|---|
| `#body` (on `<body>`) | root; also carries `dark-mode`, `with-sidebar` etc. as classes (see below) |
| `#header-root` | top header wrapper (React) |
| `#topHeaderBanner` | the actual header bar inside header-root, class `header responsive-sidebar-header` |
| `#sidebarroot` → `#sidebar` | left sidebar wrapper (React, hashed classes inside) |
| `#mainContainer` | main content column, class `container` |
| `#chatRoot` | chat widget root (React, hashed classes inside) |
| `#react-profile-mini-root` | mini profile widget |

`<body>` class list: `d body r regular with-sidebar dark-mode` — Torn already ships a `dark-mode` body class (there's no user-facing toggle for it in Settings; likely tied to system/account state), useful as a hook to detect/force dark-mode-specific overrides.

## Legacy dashboard panel pattern (repeats on every home-page widget)

Every dashboard box ("Job Information", "Working Stats", "Personal Perks", "Equipped Weapons & Armor", "Faction Information", "Latest Messages", "Latest Attacks", …) follows this exact structure:

```html
<div id="item21764408" class="sortable-box t-blue-cont h">
  <div class="title main-title title-black active top-round">
    <h5 class="box-title">Job Information</h5>
  </div>
  <div class="cont-gray bottom-round working-stats">
    <!-- panel body content (tables, lists, etc.) -->
  </div>
</div>
```

| Selector | Role | Computed style found |
|---|---|---|
| `.sortable-box` | panel outer wrapper | bg: transparent (shows body bg through) |
| `.title.title-black` | panel title bar | bg: transparent; text `#fff` |
| `.box-title` (h5) | title text | Arial, 13px, `#fff` |
| `.cont-gray` | **panel body background** | `rgb(51,51,51)` — this is the real "card" color users see |
| `.top-round` / `.bottom-round` | corner rounding, cosmetic only | — |

**This is the single most useful selector for a background-color override**: targeting `.cont-gray` (plus `.title.title-black`'s text color) reskins every dashboard panel at once without touching per-widget classes.

## Typography baseline

- Base font family site-wide: **`Arial`** (not a web font — plain system font stack fallback). No `@font-face` to fight.
- Base font size: **`12px`** on `<body>`.
- Panel titles: `13px` Arial.
- Default link color: `rgb(0, 0, 238)` — i.e. Torn does not override the browser's default link blue in this theme; expect this anywhere an `<a>` isn't explicitly styled.

## Targeting the hashed React classes

Don't write `.sidebar___c4dEc { }`. Instead:

```css
[class*="sidebar___"] { }
[class*="header___"] { }
[class*="userInformation___"] { }
[class*="accountLinksWrap___"] { }
[class*="areas___"] { }
```

Substring attribute selectors survive a hash rotation because the semantic prefix (`sidebar`, `header`, `userInformation`, …) is stable even though the suffix after `___` is a build hash. This is the same reason these are lower-confidence than the legacy classes above — if Torn ever renames the *source* component, the prefix itself changes too (no hash can save you from that), so re-verify against a live DOM dump after any major Torn frontend update.

## Confirmed: no native skin/custom-CSS setting

Checked `/preferences.php` end to end. Full settings nav: General settings, Security settings, Attack settings, Icon settings, Navigation settings, Email subscriptions, API Keys, Change name/email/password/gender, Profile Signature, Forum Signature, Uploaded Images, Self-exclusion, Close Account. **No skin, appearance, theme, or custom-CSS option exists.** Any visual reskinning has to be injected externally (extension content script, userstyle manager, or — if an iframe-hosting approach is ever made to work — a script injected into that frame). This matches prior community tooling (Torn skins are historically distributed as userscripts/userstyles, never an in-game feature).

## Crimes (`page.php#/...`) — fully React, a third font stack

`Crimes` (and its sub-activities like `cardskimming`, `pickpocketing`, etc.) load as a client-side SPA route under `page.php#/<crime-name>`, not a server-rendered page. Confirmed on `#/cardskimming`:

- Every crime has a stable, semantic root class: **`.crime-root.<crimename>-root`** (e.g. `.crime-root.cardskimming-root`) — reliable anchor per-crime, doesn't rotate.
- Everything inside it is CSS-Modules hashed: `crimeSlider___swRPQ`, `currentCrime___XM3hS`, `crimeOptionSection___FL3HG`, `[class*="crimeOption___"]`, `virtualList___G10jJ`, `virtualItem___KHUp2`/`virtual-item` (this one has a stable un-hashed alias class too — prefer `.virtual-item` over the hashed one where a plain alias exists).
- **Font is different here**: computed `font-family` is `"Fjalla One", sans-serif` — a Google web font — not the Arial used on the legacy dashboard. `font-size` for crime option rows is `13px`.
- A crime "option" row background: `rgb(42, 42, 42)` (`[class*="crimeOption___"]`), slightly lighter than the dashboard's `.cont-gray` (`rgb(51,51,51)`) — these are two independently-styled dark grays, not one shared variable in Torn's own CSS.

**Implication for theming**: a font-family override must hit at least two separate stacks to be complete — `Arial` (legacy/server-rendered pages: Home, Settings, most tables) and `"Fjalla One", sans-serif` (React SPA pages: Crimes and likely Missions/other newer sections). A single `body { font-family: ... }` rule will not reach the Crimes page because Fjalla One is set explicitly on nested elements, not inherited from `<body>` — needs its own override targeting `.crime-root` and descendants (or a broad `*` override, see theme.css).

## Item Market (`page.php#/market/...`) — React, Headless UI, Arial

Another React SPA route, but **no stable semantic root class** like Crimes has — everything from the tab panel down is Headless UI + CSS Modules:

```
#headlessui-tabs-panel-..._r_1m_   (Headless UI auto-generated id — do not rely on, regenerates per render)
  .itemListWrapper___x4xbg
    .itemList___aHzcT (<ul>)
      <li> → .itemTile___gJeSo
        .title___nHwkf → .name___HtUo7.t-overflow (item name text)
```

Font here is **Arial** again (not Fjalla One) — confirms the font stack is not a single global React vs. legacy split; it varies per-section and must be checked per page rather than assumed. Use `[class*="itemTile___"]`, `[class*="itemList___"]` substring selectors; there's no non-hashed fallback class on this page the way Crimes has `.crime-root`.

## Pages captured so far

- `index.php` (Home) — dashboard panel pattern, header, sidebar, body classes
- `preferences.php` (Settings) — confirmed no skin option
- `page.php#/cardskimming` (Crimes → Card Skimming) — React SPA pattern, Fjalla One font, per-crime root class
- `page.php#/market/...` (Item Market) — React SPA, Headless UI, Arial font, no stable root class

Not yet captured: Faction (user has none to inspect — redirects to faction-creation flow), City, individual stat/attack pages, other Crimes sub-activities (Bootlegging, Pickpocketing, Graffiti, etc. — expected to share the `.crime-root.<name>-root` pattern but not individually verified), Missions (`missions.php` returned an Error page directly — likely needs in-app navigation rather than a direct URL) — the legacy `.sortable-box` / `.cont-gray` pattern is expected to hold on most server-rendered pages, but should be spot-checked before assuming full coverage.
