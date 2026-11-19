// Fetches the sources a browser can't read (no CORS headers) and writes each envelope to
// <out>/<source id>.json, which the app loads from <base>data/. Runs once per build and on a
// schedule (.github/workflows/fredericton-snapshot.yml in the portfolio repo).
//
//   npm run snapshot -- [out dir]     default: public/data
//
// A failed fetch keeps the last good snapshot, so the page shows it as out of date instead of
// losing it. With nothing to keep, the failure itself is written so the page can say why.
// Unchanged data keeps the old file too (for up to REWRITE_UNCHANGED_MS), so the scheduled job
// only commits when something changed.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Envelope } from "../src/lib/envelope";
import { getCbcNb } from "../src/sources/adapters/cbc-nb";
import { getFuel } from "../src/sources/adapters/nbeub-fuel";

const snapshotters: Record<string, () => Promise<Envelope<unknown>>> = {
  "cbc-nb": getCbcNb,
  "nbeub-fuel": getFuel,
};

/** How long unchanged data may keep its old timestamps; "checked" sources need them fairly fresh. */
const REWRITE_UNCHANGED_MS = 6 * 3600_000;

const outDir = process.argv.slice(2).find((a) => !a.startsWith("-")) ?? "public/data";

async function previous(path: string): Promise<Envelope<unknown> | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as Envelope<unknown>;
  } catch {
    return null;
  }
}

await mkdir(outDir, { recursive: true });

for (const [id, load] of Object.entries(snapshotters)) {
  const path = join(outDir, `${id}.json`);
  const fresh = await load();
  const last = await previous(path);

  if (!fresh.ok) {
    // Shows as an annotation in GitHub Actions, without failing the run.
    console.log(`::warning title=${id}::${fresh.error}${last?.ok ? " (kept the last good snapshot)" : ""}`);
    if (!last?.ok) await writeFile(path, JSON.stringify(fresh) + "\n");
    continue;
  }

  const unchanged =
    last?.ok &&
    JSON.stringify(last.data) === JSON.stringify(fresh.data) &&
    Date.now() - Date.parse(last.fetchedAt) < REWRITE_UNCHANGED_MS;
  if (!unchanged) await writeFile(path, JSON.stringify(fresh) + "\n");
  console.log(`${id}: ${unchanged ? "unchanged" : "updated"} → ${path}`);
}
