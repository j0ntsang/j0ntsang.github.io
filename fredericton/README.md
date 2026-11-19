# Fredericton today

A civic dashboard for Fredericton, NB: weather and warnings, the Wolastoq river level, air quality, UV, transit, roads and highways, fuel prices, CBC news, the downtown webcams and garbage/recycling day. Every card shows when its data was observed and where it came from, and `/sources` lists every source with its owner, licence, cadence and live status.

It's a static app that lives inside the portfolio repo as its own package, so it can move to its own domain unchanged. Sources that allow it are fetched by the browser; the rest are fetched by a snapshot job and published as JSON.

## Run

```sh
npm install
npm run dev        # http://localhost:5180/fredericton/
npm run snapshot   # fetch the snapshot sources into public/data/ (dev reads them from there)
npm test
```

## Build and deploy

- **Inside the portfolio** (`jontsang.ca/fredericton/`): the portfolio's `npm run build` builds this package too, and the portfolio's `npm run deploy` ships it.
- **On its own domain**: `npm run build:standalone` builds into `dist/` with base `/`. Deploy `dist/` anywhere static, and move the snapshot workflow with it.

In the portfolio, a scheduled workflow refreshes the snapshot data every 30 minutes without a redeploy. If a fetch fails, the last good data is kept and the page marks it out of date.

## Inside the terminal

`fredericton [page]` in the portfolio's terminal opens this app in a window. There, Chromium plays the webcams inline; other browsers show stills with a "Watch live on YouTube" link. Opened directly, the players work everywhere.

## Add a source

1. Add an entry to `src/sources/registry.ts`.
2. Write an adapter in `src/sources/adapters/`.
3. Load it from the browser if the upstream allows cross-origin requests; otherwise add it to the snapshot.
4. Render it in a card on its section's page.
