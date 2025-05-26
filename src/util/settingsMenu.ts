export function initializeSettingsMenu() {
  const darkModeCheckbox = document.querySelector(
    'input[name="dark_mode"]'
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

  const initialTheme = getStoredTheme();
  applyTheme(initialTheme);

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
}
