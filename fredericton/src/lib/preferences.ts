/**
 * Saved on this device in localStorage. Keys are prefixed: at jontsang.ca/fredericton the app
 * shares an origin (and storage) with the terminal site.
 */
export const COLLECTION_LOCATION_KEY = "fredericton:collection-location";
/** Also read by the boot script in index.html, before first paint. */
export const THEME_KEY = "fredericton:theme";

export type ThemeChoice = "light" | "dark" | "system";

/** Storage can be blocked (private windows, site data off); the app then just doesn't remember. */
export function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Not remembered; nothing else depends on it.
  }
}
