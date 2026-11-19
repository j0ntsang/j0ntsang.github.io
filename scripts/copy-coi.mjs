// Copies coi-serviceworker into public/, patched so that opening /fredericton/ as its own page
// skips cross-origin isolation: that page embeds YouTube players, which COEP would block. In
// the terminal the same page loads in an iframe (destination "iframe"), still gets COEP, and
// so can live inside the isolated terminal.

import { readFile, writeFile } from "node:fs/promises";

const ANCHOR = "const r = event.request;";
const PATCH = `${ANCHOR}
        // Patched by scripts/copy-coi.mjs: a top-level visit to an app that embeds third-party players.
        if (r.mode === "navigate" && r.destination === "document" &&
            new URL(r.url).pathname.startsWith(new URL("fredericton/", self.registration.scope).pathname)) {
            return;
        }`;

const source = await readFile(new URL("../node_modules/coi-serviceworker/coi-serviceworker.js", import.meta.url), "utf8");
if (!source.includes(ANCHOR)) throw new Error(`coi-serviceworker changed: "${ANCHOR}" not found, update scripts/copy-coi.mjs`);
await writeFile(new URL("../public/coi-serviceworker.js", import.meta.url), source.replace(ANCHOR, PATCH));
