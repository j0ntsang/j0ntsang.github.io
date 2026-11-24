# Step 02: Alpine image: fetched at build time, hosted or downloaded at runtime

PR 1 (Linux in a window). Prerequisites: step 01 (`src/os/unkernel/vm.ts` exists, `unkernel` pinned).

## Context

- unkernel's browser SDK never downloads distro images itself: "In the browser, host the image yourself (it is read lazily with range requests)".
- The image must not be committed (repo rule). It's downloaded at **build time** from the GitHub release matching the installed package version, verified, and placed in gitignored `public/distros/`. Vite copies `public/` into `dist/`, and GitHub Pages serves it.
- Two runtime modes (user's requirement: "hosted, or downloaded at runtime as part of the POST"):
  - `hosted`: pass the URL as `distro`. The SDK range-reads it lazily (fast first boot, many small requests).
  - `download`: during the boot POST, fetch the whole file with a progress readout, check SHA-256, cache it in Cache Storage, and hand the SDK a read-only `BlockDevice` over the bytes. Later boots are instant and work offline.
  - `none`: the busybox base shell, no image.
- The browser **can't** fetch from github.com release URLs (no CORS headers, checked 2026-11-24), so runtime fetches use our own origin by default. GitHub Pages answers Range GETs with 206 (checked on jontsang.ca).

Release facts for `v0.2.0-261124-c08e977`:
`https://github.com/pithings/unkernel/releases/download/v0.2.0-261124-c08e977/distros.json` lists
`alpine.erofs`, size `4046848`, sha256 `bb9bed60c5d5418dc35b23ed69112882df7a7c5ae878490fc45a82fc5c28ffab`, `"abi": 4`.

## Files

1. `scripts/fetch-distro.mjs` (new):
   ```js
   // Downloads the distro image that matches the installed unkernel into public/distros/
   // (gitignored: binaries aren't committed). Verifies size and SHA-256 against the
   // release's distros.json. Skips the download when the file already verifies.

   import { createHash } from "node:crypto";
   import { mkdir, readFile, writeFile } from "node:fs/promises";

   const DISTROS = ["alpine"];
   const pkg = JSON.parse(await readFile(new URL("../node_modules/unkernel/package.json", import.meta.url), "utf8"));
   const base = `https://github.com/pithings/unkernel/releases/download/v${pkg.version}/`;
   const out = new URL("../public/distros/", import.meta.url);
   await mkdir(out, { recursive: true });

   const get = async (name) => {
     const res = await fetch(base + name);
     if (!res.ok) throw new Error(`${name}: HTTP ${res.status} from ${base}`);
     return new Uint8Array(await res.arrayBuffer());
   };
   const sha256 = (b) => createHash("sha256").update(b).digest("hex");

   const index = JSON.parse(new TextDecoder().decode(await get("distros.json")));
   const kept = { ...index, distros: [] };
   for (const name of DISTROS) {
     const entry = index.distros.find((d) => d.name === name);
     if (!entry) throw new Error(`${name} is not in distros.json for ${pkg.version}`);
     const target = new URL(entry.file, out);
     const existing = await readFile(target).catch(() => null);
     if (!(existing && existing.length === entry.size && sha256(existing) === entry.sha256)) {
       const bytes = await get(entry.file);
       if (bytes.length !== entry.size || sha256(bytes) !== entry.sha256) throw new Error(`${entry.file}: size or SHA-256 mismatch`);
       await writeFile(target, bytes);
     }
     kept.distros.push(entry);
   }
   // The runtime reads sizes and hashes from here (download mode).
   await writeFile(new URL("distros.json", out), JSON.stringify({ ...kept, version: pkg.version }, null, 2));
   ```

2. `package.json` scripts: add `"fetch:distro": "node scripts/fetch-distro.mjs"`, and prepend it to `dev` and `build`:
   ```json
   "dev": "npm run copy:coi && npm run fetch:distro && vite",
   "build": "npm run copy:coi && npm run fetch:distro && npm run build:fredericton && vite build",
   ```

3. `.gitignore`: add
   ```
   # unkernel distro images: fetched by scripts/fetch-distro.mjs, never committed
   public/distros
   ```

4. `src/os/unkernel/image.ts` (new):
   ```ts
   // os/unkernel/image — where the guest's root image comes from.
   //
   //   none      busybox base shell, nothing to fetch
   //   hosted    our own copy, read lazily with Range requests (needs no full download)
   //   download  fetched whole during the boot POST, SHA-256 checked, kept in Cache Storage

   import { F_RO, type BlockDevice } from "unkernel";

   export type ImageMode = "none" | "hosted" | "download";
   export interface ImageEntry { name: string; file: string; size: number; sha256: string }

   const CACHE = "unkernel-distros";
   const base = () => new URL("distros/", document.baseURI);

   export async function distroIndex(): Promise<ImageEntry[]> {
     const res = await fetch(new URL("distros.json", base()));
     if (!res.ok) throw new Error(`distros.json: HTTP ${res.status}`);
     return (await res.json()).distros;
   }

   /** The URL a hosted image is range-read from. */
   export const hostedUrl = (entry: ImageEntry) => new URL(entry.file, base()).href;

   /** Fetch (or reuse from cache) the whole image; report progress in bytes. */
   export async function downloadImage(entry: ImageEntry, onProgress: (done: number, total: number) => void): Promise<BlockDevice> {
     const url = hostedUrl(entry);
     const cache = await caches.open(CACHE).catch(() => null);
     let bytes = new Uint8Array(await (await cache?.match(url))?.arrayBuffer() ?? new ArrayBuffer(0));
     if (bytes.length !== entry.size || (await hex(bytes)) !== entry.sha256) {
       bytes = await fetchWithProgress(url, entry.size, onProgress);
       if ((await hex(bytes)) !== entry.sha256) throw new Error(`${entry.file}: SHA-256 mismatch`);
       await cache?.put(url, new Response(bytes));
     }
     onProgress(entry.size, entry.size);
     return memoryDisk(bytes);
   }

   function memoryDisk(bytes: Uint8Array): BlockDevice {
     return {
       size: bytes.length,
       readOnly: true,
       flags: F_RO,
       read(off, views) {
         for (const v of views) { v.set(bytes.subarray(off, off + v.length)); off += v.length; }
       },
       write() { throw new Error("read-only image"); },
     };
   }

   async function fetchWithProgress(url: string, total: number, onProgress: (d: number, t: number) => void) {
     const res = await fetch(url);
     if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`);
     const out = new Uint8Array(total);
     let done = 0;
     const reader = res.body.getReader();
     for (;;) {
       const { value, done: end } = await reader.read();
       if (end) break;
       out.set(value, done);
       done += value.length;
       onProgress(done, total);
     }
     if (done !== total) throw new Error(`${url}: got ${done} of ${total} bytes`);
     return out;
   }

   async function hex(bytes: Uint8Array) {
     const d = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
     return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
   }
   ```
   Check against the installed types (`node_modules/unkernel/dist/_chunks/index.d.mts`, `interface BlockDevice`): `read(off, views: Uint8Array[])`, `write(off, views)`, `size` a multiple of 512 (4,046,848 = 512 × 7,904 ✓).

5. `src/os/unkernel/vm.ts`: add a resolver used by every caller:
   ```ts
   import { distroIndex, downloadImage, hostedUrl, type ImageMode } from "./image";

   export async function resolveDistro(mode: ImageMode, name = "alpine", onBytes?: (done: number, total: number) => void) {
     if (mode === "none") return undefined;
     const entry = (await distroIndex()).find((d) => d.name === name);
     if (!entry) throw new Error(`no ${name} image (run npm run fetch:distro)`);
     return mode === "hosted" ? hostedUrl(entry) : downloadImage(entry, onBytes ?? (() => {}));
   }
   ```

## Verify

1. `npm run fetch:distro` twice: the first run downloads, the second makes no network fetch for the image (add a `console.log` while testing, or time it). `git status` shows no `public/distros` files.
2. Dev console:
   ```js
   const m = await import("/src/os/unkernel/vm.ts");
   for (const mode of ["hosted", "download"]) {
     const vm = await m.bootLinux({ distro: await m.resolveDistro(mode, "alpine", (d, t) => console.log(mode, d, t)) });
     console.log(mode, (await vm.exec("cat", ["/etc/alpine-release"])).stdout);   // 3.24.x
     await vm.stop?.();
   }
   ```
3. **Range through the service worker** (index risk): `npm run build && npm run preview`, load the page twice (the SW activates and reloads), then in the console:
   ```js
   const r = await fetch("distros/alpine.erofs", { headers: { Range: "bytes=0-1023" } });
   console.log(r.status, r.headers.get("content-range"));   // 206 "bytes 0-1023/4046848"
   ```
   If it's 200, patch `scripts/copy-coi.mjs` so requests under `distros/` return before `respondWith` (same pattern as the `fredericton/` patch), and note it in the CHANGELOG.
4. tsc + unit tests green.

## CHANGELOG entry

Under `### Added`:
```
- Step 02: Alpine image fetched at build time into gitignored public/distros (size + SHA-256 checked against the release); runtime modes none / hosted (Range) / download (POST, Cache Storage, BlockDevice).
```
Add `### Changed` too, if the SW needed a Range patch.

## Checklist
- [ ] Image not tracked by git
- [ ] hosted and download both boot Alpine
- [ ] Range returns 206 in a production build through the SW
- [ ] CHANGELOG updated
