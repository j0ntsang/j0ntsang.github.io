// october/wiki — posters and links from Wikipedia, hotlinked.
//
// Why Wikipedia: the site runs cross-origin isolated (COEP require-corp, for
// SharedArrayBuffer), so a cross-origin <img> only loads if its host allows
// CORS. Wikimedia sends `Access-Control-Allow-Origin: *` on both its API and
// upload.wikimedia.org, needs no API key, and one request resolves up to 50
// titles. Results are cached in /var/cache so each title is fetched once,
// except that misses and posterless pages are retried after a day: new films
// often get their article, or a poster, only after release.

import type { Sys } from "../../os/kernel/syscalls";

export interface WikiPage {
  url: string;
  poster?: string;
}

/** title → page, or null when Wikipedia has no such article. */
export type WikiIndex = Record<string, WikiPage | null>;

/**
 * A title in the cache file: its page, or `{ fetchedAt }` for a miss. Misses
 * and posterless pages carry fetchedAt so they can be retried. Older caches
 * stored misses as null and never stamped anything.
 */
interface CacheEntry {
  url?: string;
  poster?: string;
  fetchedAt?: number;
}

type WikiCache = Record<string, CacheEntry | null>;

type WikiSys = Pick<Sys, "readFile" | "writeFile" | "fetch">;

const CACHE_PATH = "/var/cache/october/wiki.json";
const WIKI_API_URL = "https://en.wikipedia.org/w/api.php";
const MAX_TITLES_PER_QUERY = 50;
const RETRY_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * One API query. MediaWiki reports errors as HTTP 200 with an `error` body,
 * and leaves out `query` when nothing matched.
 */
async function queryApi<Query>(params: Record<string, string>, sys: Pick<Sys, "fetch">): Promise<Query | undefined> {
  const search = new URLSearchParams({ action: "query", format: "json", origin: "*", ...params });
  const res = await sys.fetch(`${WIKI_API_URL}?${search}`, {
    headers: { "Api-User-Agent": "jontsang.ca-october/1.0 (https://jontsang.ca)" },
  });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const body = (await res.json()) as { error?: { code: string }; query?: Query };
  if (body.error) throw new Error(`Wikipedia API: ${body.error.code}`);
  return body.query;
}

interface PagesQuery {
  normalized?: { from: string; to: string }[];
  redirects?: { from: string; to: string }[];
  pages?: Record<string, { title: string; missing?: string; fullurl?: string; thumbnail?: { source: string } }>;
}

async function fetchWikiPages(titles: string[], sys: WikiSys): Promise<WikiIndex> {
  const query = await queryApi<PagesQuery>(
    {
      redirects: "1",
      prop: "pageimages|info",
      inprop: "url",
      piprop: "thumbnail",
      pithumbsize: "300",
      pilicense: "any", // film posters are non-free images
      titles: titles.join("|"),
    },
    sys,
  );
  // Every title comes back as a page, found or missing, so no query means a bad response, not "no articles".
  if (!query) throw new Error("Wikipedia API: response has no query");

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

async function readCache(sys: WikiSys): Promise<WikiCache> {
  try {
    return JSON.parse(await sys.readFile(CACHE_PATH));
  } catch {
    return {}; // First run, or the cache was removed with rm.
  }
}

/** The cache is best effort: if the disk is full, the write still holds for this session. */
const writeCache = (cache: WikiCache, sys: WikiSys) =>
  sys.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n").catch(() => {});

/** A page with a poster is final; a miss or a posterless page is asked about again after a day. */
const isFresh = (entry: CacheEntry | null | undefined, now: number) =>
  !!entry && (!!entry.poster || now - (entry.fetchedAt ?? 0) < RETRY_AFTER_MS);

const toEntry = (page: WikiPage | null, now: number): CacheEntry => (page?.poster ? page : { ...page, fetchedAt: now });

const toPage = (entry: CacheEntry | null | undefined): WikiPage | null =>
  entry?.url ? { url: entry.url, poster: entry.poster } : null;

/** Record pages we already know (e.g. a picked search result) so they count as fetched. */
export async function rememberWiki(pages: WikiIndex, sys: WikiSys) {
  const cache = await readCache(sys);
  const now = Date.now();
  for (const [title, page] of Object.entries(pages)) cache[title] = toEntry(page, now);
  await writeCache(cache, sys);
}

export interface FilmResult extends WikiPage {
  /** Wikipedia page title, stored as the movie's `wiki` field. */
  title: string;
  /** Short description, e.g. "1982 film directed by John Carpenter". */
  description?: string;
}

interface SearchQuery {
  pages?: Record<string, { index: number; title: string; fullurl: string; description?: string; thumbnail?: { source: string } }>;
}

const isFilm = (r: FilmResult) =>
  /\b(film|movie)\b/i.test(r.description ?? "") && !/\b(series|franchise|list)\b/i.test(r.description ?? "");

/** Each word must appear in the article title; plain text would match pages that merely mention them. */
const titleQuery = (query: string) =>
  query
    .split(/\s+/)
    .map((word) => word.replace(/["\\]/g, ""))
    .filter(Boolean)
    .map((word) => `intitle:"${word}"`)
    .join(" ");

/** Title search, biased to films: "film" must appear in the article and film pages are ranked first. */
export async function searchFilms(query: string, sys: Pick<Sys, "fetch">): Promise<FilmResult[]> {
  const found = await queryApi<SearchQuery>(
    {
      generator: "search",
      gsrsearch: `${titleQuery(query)} film`,
      gsrnamespace: "0",
      gsrlimit: "10",
      prop: "pageimages|info|description",
      inprop: "url",
      piprop: "thumbnail",
      pithumbsize: "300",
      pilicense: "any",
    },
    sys,
  );

  const results = Object.values(found?.pages ?? {})
    .sort((a, b) => a.index - b.index)
    .map((p) => ({ title: p.title, url: p.fullurl, poster: p.thumbnail?.source, description: p.description }));
  return [...results.filter(isFilm), ...results.filter((r) => !isFilm(r))];
}

export async function resolveWiki(titles: string[], sys: WikiSys): Promise<WikiIndex> {
  const cache = await readCache(sys);
  const now = Date.now();

  const stale = Array.from(new Set(titles)).filter((t) => !isFresh(cache[t], now));
  if (stale.length) {
    try {
      for (let i = 0; i < stale.length; i += MAX_TITLES_PER_QUERY) {
        const pages = await fetchWikiPages(stale.slice(i, i + MAX_TITLES_PER_QUERY), sys);
        for (const [title, page] of Object.entries(pages)) cache[title] = toEntry(page, now);
      }
    } catch (err) {
      // A failed retry keeps the old answer; only a title never fetched has none.
      if (stale.some((t) => !(t in cache))) throw err;
    }
    await writeCache(cache, sys);
  }

  return Object.fromEntries(titles.map((t) => [t, toPage(cache[t])]));
}
