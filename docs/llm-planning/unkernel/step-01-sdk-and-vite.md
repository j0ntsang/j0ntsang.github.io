# Step 01: add the unkernel SDK and wire Vite

PR 1 (Linux in a window). Prerequisites: none.

## Context

unkernel is Linux compiled to WebAssembly. The npm package ships the kernel (`dist/unkernel.wasm`, ~11.4 MB) and a browser entry (`dist/web.mjs`). The kernel boots a busybox base shell with no other download. This step only makes the package importable and bootable from our Vite build, behind a lazily loaded module. Nothing user-visible changes.

Settled (index D5–D8): pin the exact version, pass the kernel URL explicitly via `?url`, load lazily, run inline with 1 CPU, no network.

## Files

1. `package.json`: add the dependency (exact):
   ```json
   "unkernel": "0.2.0-261124-c08e977"
   ```
   Run `npm install unkernel@0.2.0-261124-c08e977 --save-exact`.

2. `vite.config.mjs`: add at the top level of `defineConfig({...})`:
   ```js
   // unkernel finds its wasm with new URL(..., import.meta.url); pre-bundling would move
   // the module away from it. We also pass the kernel URL explicitly (src/os/unkernel/vm.ts).
   optimizeDeps: { exclude: ["unkernel"] },
   ```
   Also add `"unkernel"` to `build.rollupOptions.output.manualChunks` as its own chunk:
   ```js
   manualChunks: {
     xterm: ["@xterm/xterm", "@xterm/addon-fit"],
     unkernel: ["unkernel"],
   },
   ```

3. `src/os/unkernel/vm.ts` (new). It's the only module that imports `unkernel`. Everything else imports from here, always via `await import()`.
   ```ts
   // os/unkernel/vm — a real Linux kernel (unkernel, compiled to wasm) as a device of this OS.
   //
   // The only importer of the "unkernel" package. Callers load this module with import(),
   // so the ~11 MB kernel is fetched only when someone boots Linux.

   import { checkSupport, createKernel, type KernelHandle } from "unkernel";
   import kernelUrl from "unkernel/unkernel.wasm?url";

   export type { KernelHandle };

   export interface BootOptions {
     /** The distro image (step 02). Omitted: the busybox base shell. */
     distro?: Parameters<typeof createKernel>[0] extends infer O ? O extends { distro?: infer D } ? D : never : never;
     memoryMiB?: number;
     onProgress?: (stage: string) => void;
   }

   export async function linuxSupport() {
     const report = await checkSupport();
     return { ok: report.ok, problems: report.problems };
   }

   export async function bootLinux({ distro, memoryMiB = 256, onProgress }: BootOptions = {}): Promise<KernelHandle> {
     return createKernel({
       kernel: kernelUrl,
       distro,
       memoryMiB,
       onProgress: (p) => onProgress?.(p.stage),
       // Offline by design (index D1): no `net`.
     });
   }
   ```
   If the conditional type for `distro` won't compile, import the option type directly. Check `node_modules/unkernel/dist/_chunks/index.d.mts` for the name: search `distro?:` inside `CreateKernelOptions` and use that type (e.g. `DistroSource`).

4. `src/vite-env.d.ts`: no change needed (`vite/client` already declares `*?url`). If tsc complains about `unkernel/unkernel.wasm?url`, add:
   ```ts
   declare module "unkernel/unkernel.wasm?url" { const url: string; export default url; }
   ```

## Verify

1. `npx tsc --noEmit`: clean.
2. `npm run dev`, then in the browser devtools console on the page:
   ```js
   const m = await import("/src/os/unkernel/vm.ts");
   console.log(await m.linuxSupport());
   const vm = await m.bootLinux();
   console.log(await vm.exec("uname", ["-a"]));   // stdout contains "Linux"
   await vm.stop?.();
   ```
3. `npm run build`: `dist/static/` contains a hashed `unkernel-*.wasm` (or `.wasm` asset) and a `unkernel-*.js` chunk, and `dist/static/js/main.js` does **not** contain the unkernel code (grep for `kwemu` in `main.js`: no match).
4. `npm run test:unit`: still green.

## CHANGELOG entry

Append under `## [Unreleased]` → `### Added`:
```
- Step 01: unkernel 0.2.0-261124-c08e977 (pinned) behind src/os/unkernel/vm.ts; own Vite chunk, kernel URL passed explicitly, excluded from dep pre-bundling.
```

## Checklist
- [ ] Exact version pinned in package.json and lockfile
- [ ] `vm.exec("uname")` works in dev
- [ ] Production build emits the wasm and a separate chunk; main.js doesn't include it
- [ ] tsc + unit tests green
- [ ] CHANGELOG updated
