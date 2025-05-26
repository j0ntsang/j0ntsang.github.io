export function initializeFullscreenToggle() {
  const toggleBtn = document.getElementById(
    "fullscreenToggle"
  ) as HTMLButtonElement | null;
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    console.log("click");
    const el = document.documentElement;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen(); // Safari
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen(); // IE11
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen(); // Safari
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen(); // IE11
      }
    }
  });

  function updateButtonLabel() {
    if (!toggleBtn) return;
    toggleBtn.innerHTML = document.fullscreenElement ? "&#x29C9;" : "&#x26F6;";
  }

  document.addEventListener("fullscreenchange", updateButtonLabel);

  // Set initial label
  updateButtonLabel();
}
