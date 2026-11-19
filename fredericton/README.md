# Fredericton today

A civic dashboard for Fredericton, NB: weather and warnings, the Wolastoq river level, air quality, UV, fuel prices, CBC news, the downtown webcams and garbage/recycling day. Every card shows when its data was observed and where it came from, and `/sources` lists every source with its owner, licence, cadence and live status.

It's a static app (Vite, React 19, React Aria Components, Tailwind 4, Zod). It lives inside the portfolio repo but is its own package, so it can move to its own domain unchanged. It started as a Next.js app with server-side fetching. GitHub Pages can't run a server, so each source now loads one of two ways:

| Source | Loaded by |
|---|---|
| ECCC weather, river, AQHI and its forecast; Open-Meteo UV | The browser, directly (they send CORS headers) |
| City street closures and construction projects | The browser: the City's public ArcGIS layers (`src/lib/arcgis.ts`) |
| YouTube webcams | The browser: an `<img>` probe of each `_live` still (CORP, no CORS) |
| CBC NB news, NBEUB fuel prices | `scripts/snapshot.ts` in Node, published as `data/<id>.json` |
| Bus timetable | Snapshot: Fredericton Transit's GTFS zip, boiled down to per-stop departures (`src/lib/gtfs.ts`) |
| NB 511 highways | Snapshot, with a secret key; switched off until the key arrives (see below) |
| Garbage and recycling zones | Bundled: `src/data/collection-zones.json` (`npm run zones`) |

Fetched data is reused for its source's `revalidate` window, and open pages refresh on that cadence (`src/sources/useSource.ts`).

## Run

```sh
npm install
npm run dev        # http://localhost:5180/fredericton/
npm run snapshot   # fetch CBC + fuel into public/data/ (dev reads them from there)
npm test
```

## Build and deploy

- **Inside the portfolio** (`jontsang.ca/fredericton/`): the portfolio's `npm run build` runs this package's `build`. That takes a snapshot, typechecks, and builds into `../public/fredericton/` with base `/fredericton/`. The portfolio's `npm run deploy` ships it.
- **On its own domain**: `npm run build:standalone` builds into `dist/` with base `/`. Deploy `dist/` anywhere static, for example its own GitHub Pages repo with a `CNAME` file, and move the snapshot workflow there.

GitHub Pages has no rewrites, so the build writes an `index.html` into every route's folder (`news/index.html`, …). The client router (`src/router.tsx`) takes over from there. Paths in code have no base (`/news`); hrefs get it added.

The snapshot data goes stale between deploys. `.github/workflows/fredericton-snapshot.yml` in the portfolio runs the snapshot every 30 minutes and commits changed JSON straight to the `gh-pages` branch. Unchanged data isn't rewritten, so most runs commit nothing. If a fetch fails, the last good snapshot is kept, and the page marks it out of date once it's older than the source's `staleAfter`.

## Switching on NB 511

The adapter (`src/sources/adapters/nb511.ts`), snapshot entry, workflow secret and card are built; the registry keeps the source `blocked` until the key works.

1. Put the key in `fredericton/.env` as `NB511_KEY=…` (gitignored) and in the repo's Actions secrets as `NB511_KEY`.
2. `npm run snapshot` and check `public/data/nb511.json`. The field names follow other 511 v2 deployments and haven't been checked against NB's response: fix the Zod schemas if the snapshot fails or comes back empty when 511.gnb.ca shows events near Fredericton.
3. Set `state: "connected"` for `nb511` in `src/sources/registry.ts`. The card appears on Transportation and the source is checked on `/sources`.

## Inside the terminal

`fredericton [page]` in the portfolio's terminal opens this app in a window as a same-origin iframe. The terminal is cross-origin isolated (COEP), so this page is too when it's embedded. That only affects the webcam players: YouTube's iframe loads as `credentialless` in Chromium, and other browsers show stills with a "Watch live on YouTube" link (`embedMode()` in `src/data/webcams.ts`). Opened directly, the page isn't isolated and the players work everywhere.

Saved preferences (theme, your street) use `localStorage` keys prefixed `fredericton:`, because the app shares an origin with the terminal.

## Add a source

1. Add an entry to `src/sources/registry.ts` (owner, licence, cadence, `revalidate`, `staleAfter`, section).
2. Write `src/sources/adapters/<id>.ts`: fetch with `fetchUpstream`, parse with a Zod schema, return via `collect()`.
3. If the upstream sends CORS headers, add the adapter to `loaders` in `src/sources/index.ts`. If it doesn't, add it to `scripts/snapshot.ts` and load it with `fromSnapshot` instead.
4. Render it with `<Card>` and `useSource("<id>")`.

## Layout

```
src/
  main.tsx, App.tsx   entry, layout and route table
  router.tsx          History API router, base-path aware
  pages/              one component per section, plus /sources
  city/               per-city config
  ia/sections.ts      the information architecture
  sources/            registry, adapters, loaders, useSource
  components/         React Aria UI
scripts/
  snapshot.ts         CBC + fuel → JSON (Node)
  build-collection-zones.mjs
```
