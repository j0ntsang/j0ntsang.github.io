// october/wiki — posters and links from Wikipedia, hotlinked.
//
// Why Wikipedia: the site runs cross-origin isolated (COEP require-corp, for
// SharedArrayBuffer), so a cross-origin <img> only loads if its host allows
// CORS. Wikimedia sends `Access-Control-Allow-Origin: *` on both its API and
// upload.wikimedia.org, needs no API key, and one request resolves up to 50
// titles. Results are cached in /var/cache so each title is fetched once.

import type { Sys } from "../../os/kernel/syscalls";

export interface WikiPage {
  url: string;
  poster?: string;
}

/** title → page, or null when Wikipedia has no such article. */
export type WikiIndex = Record<string, WikiPage | null>;

type WikiSys = Pick<Sys, "readFile" | "writeFile" | "fetch">;

const CACHE = "/var/cache/october/wiki.json";
const API = "https://en.wikipedia.org/w/api.php";
const BATCH = 50;

interface QueryResponse {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: Record<string, { title: string; missing?: string; fullurl?: string; thumbnail?: { source: string } }>;
  };
}

async function lookup(titles: string[], sys: WikiSys): Promise<WikiIndex> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    prop: "pageimages|info",
    inprop: "url",
    piprop: "thumbnail",
    pithumbsize: "300",
    pilicense: "any", // film posters are non-free images
    titles: titles.join("|"),
  });
  const res = await sys.fetch(`${API}?${params}`, {
    headers: { "Api-User-Agent": "jontsang.ca-october/1.0 (https://jontsang.ca)" },
  });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const { query = {} } = (await res.json()) as QueryResponse;

  const follow = (list: { from: string; to: string }[] = [], t: string) =>
    list.find((x) => x.from === t)?.to ?? t;
  const pages = new Map(Object.values(query.pages ?? {}).map((p) => [p.title, p]));

  const result: WikiIndex = {};
  for (const title of titles) {
    const page = pages.get(follow(query.redirects, follow(query.normalized, title)));
    result[title] =
      page && !("missing" in page) && page.fullurl
        ? { url: page.fullurl, poster: page.thumbnail?.source }
        : null;
  }
  return result;
}

async function readCache(sys: WikiSys): Promise<WikiIndex> {
  try {
    return JSON.parse(await sys.readFile(CACHE));
  } catch {
    return {}; // First run, or the cache was removed with rm.
  }
}

/** Record pages we already know (e.g. a picked search result) so they're never re-fetched. */
export async function rememberWiki(pages: WikiIndex, sys: WikiSys) {
  const cache = await readCache(sys);
  await sys.writeFile(CACHE, JSON.stringify({ ...cache, ...pages }, null, 2) + "\n");
}

export interface FilmResult extends WikiPage {
  /** Wikipedia page title, stored as the movie's `wiki` field. */
  title: string;
  /** Short description, e.g. "1982 film directed by John Carpenter". */
  description?: string;
}

interface SearchResponse {
  query?: {
    pages?: Record<string, { index: number; title: string; fullurl: string; description?: string; thumbnail?: { source: string } }>;
  };
}

const isFilm = (r: FilmResult) =>
  /\b(film|movie)\b/i.test(r.description ?? "") && !/\b(series|franchise|list)\b/i.test(r.description ?? "");

/** Full-text search, biased to films: "film" is added to the query and film pages are ranked first. */
export async function searchFilms(query: string, sys: Pick<Sys, "fetch">): Promise<FilmResult[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: `${query} film`,
    gsrnamespace: "0",
    gsrlimit: "10",
    prop: "pageimages|info|description",
    inprop: "url",
    piprop: "thumbnail",
    pithumbsize: "300",
    pilicense: "any",
  });
  const res = await sys.fetch(`${API}?${params}`, {
    headers: { "Api-User-Agent": "jontsang.ca-october/1.0 (https://jontsang.ca)" },
  });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const { query: q = {} } = (await res.json()) as SearchResponse;

  const results = Object.values(q.pages ?? {})
    .sort((a, b) => a.index - b.index)
    .map((p) => ({ title: p.title, url: p.fullurl, poster: p.thumbnail?.source, description: p.description }));
  return [...results.filter(isFilm), ...results.filter((r) => !isFilm(r))];
}

export async function resolveWiki(titles: string[], sys: WikiSys): Promise<WikiIndex> {
  const cache = await readCache(sys);

  const missing = Array.from(new Set(titles)).filter((t) => !(t in cache));
  if (missing.length) {
    for (let i = 0; i < missing.length; i += BATCH) {
      Object.assign(cache, await lookup(missing.slice(i, i + BATCH), sys));
    }
    await sys.writeFile(CACHE, JSON.stringify(cache, null, 2) + "\n");
  }

  return Object.fromEntries(titles.map((t) => [t, cache[t] ?? null]));
}
