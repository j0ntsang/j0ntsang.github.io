// display/theme — the system color scheme (think gsettings' gtk-theme).
//
// The user picks a preferred theme in settings. A window can ask for its own
// theme too (october asks for "october"); the compositor applies it while that
// window is on top and hands the preference back when it closes. Colors
// themselves live in src/styles/themes.css; this only flips <html data-theme>.

export const THEMES = ["default", "october", "fallout"] as const;
export type Theme = (typeof THEMES)[number];

const KEY = "theme";
const isTheme = (t: unknown): t is Theme => THEMES.includes(t as Theme);

function stored(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return isTheme(t) ? t : "default";
  } catch {
    return "default";
  }
}

let preferred = stored();
let windowTheme: Theme | null = null;

function apply() {
  const root = document.documentElement;
  root.dataset.theme = windowTheme ?? preferred;
  const bg = getComputedStyle(root).getPropertyValue("--background-color").trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
}

export const preferredTheme = () => preferred;

export function setPreferredTheme(theme: Theme) {
  preferred = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
  apply();
}

/** Compositor only: the theme the top window asked for, or null for the preference. */
export function setWindowTheme(theme: Theme | null) {
  windowTheme = theme;
  apply();
}

apply();
