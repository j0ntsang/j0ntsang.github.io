# Step 08: the customized guest (motd, prompt, help, site files, persistent home)

PR 2. Prerequisites: step 07 (Linux boots in the main terminal through `src/boot/linux.ts` → `bootLinux()` in `src/os/unkernel/vm.ts`).

## Context

"A customized terminal from within the unkernel": the Linux entry should feel like this site, not stock Alpine. Tools available without network or a custom image (index D1):

- `createKernel({ mounts })`: host file systems served over 9p on vsock, mounted in the guest once its kwtty answers. A mount is a plain object tree (`{ "file": "text", dir: {...}, "computed": () => string }`), a `MemoryFs`, or a custom `Fs` (`getattr`, `readdir`, `open`, …). Types: `MountsOption`, `Fs` in `node_modules/unkernel/dist/_chunks/index.d.mts`.
- `vm.exec(cmd, args, { user: "root" })` runs setup commands as root (distro programs run as `user` by default, uid 1000, `/home/user`, passwordless sudo).
- `openDataDisk({ name, ... })` (browser): a persistent disk in IndexedDB labelled `kwdata`. With it attached, each distro keeps its root changes in `/data/distros/<name>/`, so `/home/user` survives reloads.
- The JS OS's site content is the Vite-bundled `rootfs/` (`src/os/fs/rootfs.ts` exposes it, along with `subtree(rootfs, path)`).

## Files

1. `src/os/unkernel/guest/` (new, text files committed, imported with `?raw`):
   - `motd`: the same banner style as `rootfs/etc/motd`, plus `Real Linux (unkernel) — offline. Type 'help'.`
   - `profile.sh`: sourced by login shells via `/etc/profile.d/jontsang.sh`:
     ```sh
     export PS1='\[\e[32m\]\u@jontsang\[\e[0m\]:\[\e[34m\]\w\[\e[0m\]\$ '
     export PATH="/run/kw/bin:$PATH"            # host commands (PR 3) win over guest names
     printf '\033]0;%s\007' "Jonathan Tsang — Linux"
     help() { cat /usr/local/share/jontsang/help; }
     ```
   - `help`: lists guest basics plus (after PR 3) the portfolio apps, and says the guest is offline, so `apk add` won't work.

2. `src/os/unkernel/vm.ts`: extend `BootOptions` with `mounts` and `dataDisk?: boolean`, passing them through to `createKernel` (`disks: [await openDataDisk({ name: "jontsang" })]` when `dataDisk`). Check `OpenDataDiskOptions` in `web.d.mts` for the required fields (`template` is likely `"bundled"`).

3. `src/boot/linux.ts`:
   - Mount the site's files read-only at `/srv/jontsang` as an object tree built from the bundled rootfs (`/usr/share/october/2026.json`, `/home/guest/october/README`, `/etc/motd`, `/usr/share/doc/unkernel/README`), so `ls /srv/jontsang` shows the same content as the JS OS.
   - After boot and before the first shell, one root `exec` that installs the customization idempotently:
     ```sh
     install -D -m644 /srv/jontsang-guest/motd /etc/motd
     install -D -m644 /srv/jontsang-guest/profile.sh /etc/profile.d/jontsang.sh
     install -D -m644 /srv/jontsang-guest/help /usr/local/share/jontsang/help
     echo jontsang > /etc/hostname && hostname jontsang
     ```
     where `/srv/jontsang-guest` is a second small object-tree mount carrying the three `?raw` files.
   - Attach the data disk (`dataDisk: true`), so `/home/user` persists. Add a POST step label "Mounting persistent disk (IndexedDB)". A failure there is non-fatal: boot without persistence and WARN.
   - Use the `step()` helper for "Mounting /srv/jontsang (9p)" and "Applying jontsang profile".

4. Settings (optional, only if cheap): no new UI in this step. Resetting the disk can be a guest-side `help` note: `resetDataDisk` is a later nicety.

## Verify
- `?boot=linux`: the motd shows; the prompt is `user@jontsang:~$`; `help` prints the site help; `cat /srv/jontsang/usr/share/october/2026.json` matches the shipped file; writing to `/srv/jontsang` fails (read-only).
- `echo hi > ~/note`, reload, boot Linux again → `cat ~/note` prints `hi`.
- In a private window (IndexedDB may be unavailable), boot still succeeds with a WARN.
- `npm test` green. Add a grub.spec case for the prompt or hostname.

## CHANGELOG entry

Under `### Added`:
```
- Step 08: customized guest — motd, PS1/hostname jontsang, help, site files at /srv/jontsang (9p, read-only), persistent home on an IndexedDB data disk.
```

## Checklist
- [ ] Customization is idempotent across reboots with a persistent disk
- [ ] Boot survives having no IndexedDB
- [ ] CHANGELOG updated
