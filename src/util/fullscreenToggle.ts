export function initializeFullscreenToggle() {
  const toggleBtn = document.getElementById(
    "fullscreenToggle"
  ) as HTMLButtonElement | null;
  if (!toggleBtn) return;

  const iconSpan = toggleBtn.querySelector(
    ".fullscreen-toggle-icon"
  ) as HTMLSpanElement | null;

  toggleBtn.addEventListener("click", () => {
    const el = document.documentElement;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  });

  function updateButtonLabel() {
    if (!iconSpan) return;
    iconSpan.innerHTML = document.fullscreenElement ? "&#x29C9;" : "&#x26F6;";
  }

  document.addEventListener("fullscreenchange", updateButtonLabel);

  updateButtonLabel();
}
