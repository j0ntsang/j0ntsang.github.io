import { preferredTheme, setPreferredTheme, Theme } from "../os/display/theme";

export function initializeSettingsMenu() {
  const themeSelect = document.querySelector(
    'select[name="theme"]'
  ) as HTMLSelectElement | null;

  const animationCheckbox = document.querySelector(
    'input[name="animation"]'
  ) as HTMLInputElement | null;

  function applyAnimation(enabled: boolean) {
    document.documentElement.classList.toggle("animation", enabled);
  }

  // index.html sets the initial class before first paint.
  const initialAnimation =
    document.documentElement.classList.contains("animation");

  if (themeSelect) {
    themeSelect.value = preferredTheme();
    themeSelect.addEventListener("change", () =>
      setPreferredTheme(themeSelect.value as Theme)
    );
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
