/**
 * Saved on this device in localStorage. Keys are prefixed: at jontsang.ca/fredericton the app
 * shares an origin (and storage) with the terminal site.
 */
export const COLLECTION_LOCATION_KEY = "fredericton:collection-location";
export const TRANSIT_STOP_KEY = "fredericton:transit-stop";
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

let storageWorks: boolean | undefined;

/** Whether this browser keeps what we save. Checked once: a write and a delete of a scratch key. */
export function canSavePreferences(): boolean {
  if (storageWorks === undefined) {
    try {
      localStorage.setItem("fredericton:probe", "1");
      localStorage.removeItem("fredericton:probe");
      storageWorks = true;
    } catch {
      storageWorks = false;
    }
  }
  return storageWorks;
}
