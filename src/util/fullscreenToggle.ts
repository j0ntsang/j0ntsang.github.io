export function initializeFullscreenToggle() {
  const toggleBtn = document.getElementById(
    "fullscreenToggle"
  ) as HTMLButtonElement | null;
  if (!toggleBtn) return;

  // iPhone Safari, and iframes without allow="fullscreen", can't go fullscreen.
  if (!document.fullscreenEnabled && !(document as any).webkitFullscreenEnabled) {
    toggleBtn.remove();
    return;
  }

  const iconSpan = toggleBtn.querySelector(
    ".fullscreen-toggle-icon"
  ) as HTMLSpanElement | null;

  // The browser can still refuse (Permissions-Policy, no user gesture); the
  // button just stays as it was.
  const warn = (err: unknown) => console.warn("Fullscreen toggle failed:", err);

  toggleBtn.addEventListener("click", () => {
    const el = document.documentElement;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(warn);
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(warn);
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  });

  const updateButtonState = () => {
    const isFullscreen = !!document.fullscreenElement;
    toggleBtn.setAttribute("aria-pressed", String(isFullscreen));
    toggleBtn.title = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";
    if (iconSpan) iconSpan.textContent = isFullscreen ? "\u29C9" : "\u26F6";
  };

  document.addEventListener("fullscreenchange", updateButtonState);

  updateButtonState();
}
