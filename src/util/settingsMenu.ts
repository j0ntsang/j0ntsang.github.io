export function initializeSettingsMenu() {
  const darkModeCheckbox = document.querySelector(
    'input[name="dark_mode"]'
  ) as HTMLInputElement | null;

  const animationCheckbox = document.querySelector(
    'input[name="animation"]'
  ) as HTMLInputElement | null;

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  function getStoredTheme(): "dark" | "light" {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return prefersDark ? "dark" : "light";
  }

  function applyTheme(theme: "dark" | "light") {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(theme);
  }

  function getStoredAnimation(): boolean {
    return localStorage.getItem("animation") === "true";
  }

  function applyAnimation(enabled: boolean) {
    document.body.classList.toggle("animation", enabled);
  }

  const initialTheme = getStoredTheme();
  applyTheme(initialTheme);

  const initialAnimation = getStoredAnimation();
  applyAnimation(initialAnimation);

  if (darkModeCheckbox) {
    darkModeCheckbox.checked = initialTheme === "dark";
    darkModeCheckbox.disabled = false;

    darkModeCheckbox.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const theme = target.checked ? "dark" : "light";
      applyTheme(theme);
      localStorage.setItem("theme", theme);
    });
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
