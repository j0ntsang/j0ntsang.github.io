export function initializeSettingsMenu() {
  const darkModeCheckbox = document.querySelector(
    'input[name="dark_mode"]'
  ) as HTMLInputElement | null;

  const animationCheckbox = document.querySelector(
    'input[name="animation"]'
  ) as HTMLInputElement | null;

  function applyTheme(theme: "dark" | "light") {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  }

  function getStoredAnimation(): boolean {
    return localStorage.getItem("animation") === "true";
  }

  function applyAnimation(enabled: boolean) {
    document.documentElement.classList.toggle("animation", enabled);
  }

  // Light mode is disabled for now; always dark regardless of OS or stored preference.
  applyTheme("dark");

  const initialAnimation = getStoredAnimation();
  applyAnimation(initialAnimation);

  if (darkModeCheckbox) {
    darkModeCheckbox.checked = true;
    darkModeCheckbox.disabled = true;
  }

  if (animationCheckbox) {
    animationCheckbox.checked = initialAnimation;
    animationCheckbox.disabled = false;

    animationCheckbox.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const isEnabled = target.checked;
      applyAnimation(isEnabled);
      localStorage.setItem("animation", String(isEnabled));
    });
  }
}
