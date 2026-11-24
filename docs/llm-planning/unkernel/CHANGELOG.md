# Changelog: unkernel effort

## [Unreleased]

### Planning
- 2026-11-24: Plan written (index + steps 01–10). Settled: offline only, Alpine hosted or downloaded during POST, GRUB menu gated on `checkSupport()`, JS kernel kept, app bridge through unkernel's `commands` (kwcmd over vsock).
- Out of scope: guest networking or a Wisp relay (D1), Debian / guest GL / Vulkan, worker mode and SMP (D8), trynix-style Nix packages.
