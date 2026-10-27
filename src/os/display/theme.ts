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
const root = document.documentElement;
const settledListeners: (() => void)[] = [];

/** A theme color's computed value, e.g. token("--background-color"). */
export const token = (name: string) =>
  getComputedStyle(root).getPropertyValue(name).trim();

/** Run cb after each theme change, once token() returns the new colors. */
export function onThemeSettled(cb: () => void) {
  settledListeners.push(cb);
}

function apply() {
  root.dataset.theme = windowTheme ?? preferred;
  // themes.css transitions the colors when Animation is on, and reading one
  // mid-transition gets the old theme's. getAnimations() flushes style, so it
  // already includes the transitions this change started.
  const transitions = root.getAnimations().filter((a) => a instanceof CSSTransition);
  Promise.all(transitions.map((t) => t.finished)).then(
    () => settledListeners.forEach((cb) => cb()),
    () => {} // Cut short by a newer theme change, which settles itself.
  );
}

onThemeSettled(() => {
  const bg = token("--background-color");
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
});

export const preferredTheme = () => preferred;

export function setPreferredTheme(theme: Theme) {
  preferred = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the theme lasts for this page only.
  }
  apply();
}

/** Compositor only: the theme the top window asked for, or null for the preference. */
export function setWindowTheme(theme: Theme | null) {
  windowTheme = theme;
  apply();
}

apply();
