import { useSyncExternalStore, type ReactNode } from "react";
import { RouterProvider } from "react-aria-components";

/*
 * A small History API router. Paths inside the app are written without the base ("/news");
 * hrefs on the page carry it ("/fredericton/news/"), so the same build can move to its own
 * domain by changing only the Vite base. Trailing slashes match the per-route index.html
 * files the build writes, so GitHub Pages serves them without a redirect.
 */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const toHref = (path: string) => (path === "/" ? `${BASE}/` : `${BASE}${path}/`);

function readPath(): string {
  const { pathname } = window.location;
  const inApp = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  return inApp.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("popstate", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("popstate", fn);
  };
}

export function navigate(path: string) {
  if (path === readPath()) return;
  window.history.pushState(null, "", toHref(path));
  window.scrollTo(0, 0);
  notify();
}

/** The current in-app path, e.g. "/news". */
export function usePath(): string {
  return useSyncExternalStore(subscribe, readPath);
}

/** Canonicalise the address bar once (a missing trailing slash, a trailing index.html). */
export function normaliseLocation() {
  const href = toHref(readPath());
  if (window.location.pathname !== href) window.history.replaceState(null, "", href + window.location.search + window.location.hash);
}

/** React Aria links and buttons navigate client-side through this. */
export function Router({ children }: { children: ReactNode }) {
  return (
    <RouterProvider navigate={navigate} useHref={toHref}>
      {children}
    </RouterProvider>
  );
}
