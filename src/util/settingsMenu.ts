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

  const menu = document.querySelector("details.settings") as HTMLDetailsElement | null;
  if (menu) makeDismissable(menu);
}

/** Close the <details> on Escape, on a click outside it, or when Tab leaves it. */
function makeDismissable(menu: HTMLDetailsElement) {
  const summary = menu.querySelector("summary");

  menu.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !menu.open) return;
    e.preventDefault();
    e.stopPropagation();
    menu.open = false;
    summary?.focus();
  });

  // composedPath, not contains: the menu is slotted into window-manager's shadow root.
  document.addEventListener("pointerdown", (e) => {
    if (menu.open && !e.composedPath().includes(menu)) menu.open = false;
  });

  // A null relatedTarget is a click on plain text inside the menu, not leaving it.
  menu.addEventListener("focusout", (e) => {
    const next = e.relatedTarget as Node | null;
    if (menu.open && next && !menu.contains(next)) menu.open = false;
  });
}
