import { beforeEach, describe, expect, it, vi } from "vitest";
import { FsError } from "../../../os/fs/types";
import { rememberWiki, resolveWiki, searchFilms } from "../wiki";

const CACHE = "/var/cache/october/wiki.json";
const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-26T12:00:00Z").getTime();

let files: Record<string, string>;
let urls: string[];
let respond: (url: URL) => unknown;
let failWrites = false;

const sys = {
  readFile: async (p: string) => {
    if (!(p in files)) throw new FsError("ENOENT", p);
    return files[p];
  },
  writeFile: async (p: string, d: string) => {
    if (failWrites) throw new FsError("ENOSPC", p);
    files[p] = d;
  },
  fetch: async (url: string) => {
    urls.push(url);
    const body = respond(new URL(url));
    return { ok: true, status: 200, json: async () => body } as Response;
  },
};

const found = (...titles: string[]) => ({
  query: {
    pages: Object.fromEntries(
      titles.map((t, i) => [i + 1, { title: t, fullurl: `https://en.wikipedia.org/wiki/${t}`, thumbnail: { source: `${t}.jpg` } }]),
    ),
  },
});
const requested = (url: URL) => url.searchParams.get("titles")!.split("|");
const cache = () => JSON.parse(files[CACHE]);

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  files = {};
  urls = [];
  failWrites = false;
  respond = (url) => found(...requested(url));
});

describe("resolveWiki cache", () => {
  it("fetches a missing title once, then serves it from the cache", async () => {
    expect(await resolveWiki(["Clue"], sys)).toEqual({ Clue: { url: "https://en.wikipedia.org/wiki/Clue", poster: "Clue.jpg" } });
    await resolveWiki(["Clue"], sys);
    expect(urls).toHaveLength(1);
  });

  it("keeps complete entries forever", async () => {
    files[CACHE] = JSON.stringify({ Clue: { url: "u", poster: "p", fetchedAt: NOW - 30 * DAY } });
    expect(await resolveWiki(["Clue"], sys)).toEqual({ Clue: { url: "u", poster: "p" } });
    expect(urls).toHaveLength(0);
  });

  it("refetches misses and posterless entries after 24h, not before", async () => {
    files[CACHE] = JSON.stringify({
      Miss: { fetchedAt: NOW - DAY - 1 },
      Bare: { url: "u", fetchedAt: NOW - DAY - 1 },
      Recent: { fetchedAt: NOW - 1000 },
    });
    respond = (url) => ({ query: { pages: { 1: { title: "Bare", missing: "", fullurl: "" } , 2: { title: "Miss", missing: "" } } } });
    await resolveWiki(["Miss", "Bare", "Recent"], sys);
    expect(urls).toHaveLength(1);
    expect(requested(new URL(urls[0])).sort()).toEqual(["Bare", "Miss"]);
  });

  it("refetches legacy null entries", async () => {
    files[CACHE] = JSON.stringify({ Old: null });
    await resolveWiki(["Old"], sys);
    expect(urls).toHaveLength(1);
  });

  it("maps missing pages to null and follows redirects and normalization", async () => {
    respond = () => ({
      query: {
        normalized: [{ from: "clue", to: "Clue" }],
        redirects: [{ from: "Clue", to: "Clue (film)" }],
        pages: { 1: { title: "Clue (film)", fullurl: "u", thumbnail: { source: "p" } }, [-1]: { title: "Nope", missing: "" } },
      },
    });
    expect(await resolveWiki(["clue", "Nope"], sys)).toEqual({ clue: { url: "u", poster: "p" }, Nope: null });
  });

  it("batches lookups at 50 titles", async () => {
    const titles = Array.from({ length: 120 }, (_, i) => `T${i}`);
    await resolveWiki(titles, sys);
    expect(urls.map((u) => requested(new URL(u)).length)).toEqual([50, 50, 20]);
  });

  it("throws on a MediaWiki {error} body", async () => {
    respond = () => ({ error: { code: "badvalue" } });
    await expect(resolveWiki(["Clue"], sys)).rejects.toThrow("Wikipedia API: badvalue");
  });

  it("keeps the old answer when a retry fails", async () => {
    files[CACHE] = JSON.stringify({ Bare: { url: "u", fetchedAt: NOW - 2 * DAY } });
    respond = () => ({ error: { code: "ratelimited" } });
    expect(await resolveWiki(["Bare"], sys)).toEqual({ Bare: { url: "u", poster: undefined } });
  });

  it("returns results even when the cache write fails", async () => {
    failWrites = true;
    expect(await resolveWiki(["Clue"], sys)).toEqual({ Clue: { url: "https://en.wikipedia.org/wiki/Clue", poster: "Clue.jpg" } });
  });

  it("stamps fetchedAt on posterless pages only", async () => {
    respond = () => ({ query: { pages: { 1: { title: "A", fullurl: "ua" }, 2: { title: "B", fullurl: "ub", thumbnail: { source: "p" } } } } });
    await resolveWiki(["A", "B"], sys);
    expect(cache()).toEqual({ A: { url: "ua", fetchedAt: NOW }, B: { url: "ub", poster: "p" } });
  });
});

describe("rememberWiki", () => {
  it("records known pages as fetched, and survives a failed write", async () => {
    await rememberWiki({ Clue: { url: "u", poster: "p" } }, sys);
    expect(cache()).toEqual({ Clue: { url: "u", poster: "p" } });
    failWrites = true;
    await expect(rememberWiki({ X: null }, sys)).resolves.toBeUndefined();
  });
});

describe("searchFilms", () => {
  it("strips quotes and backslashes from each word, and sends one intitle per word", async () => {
    respond = () => ({ batchcomplete: "" });
    expect(await searchFilms('the "thing\\" ', sys)).toEqual([]);
    const q = new URL(urls[0]).searchParams.get("gsrsearch");
    expect(q).toBe('intitle:"the" intitle:"thing" film');
  });

  it("ranks films first, then by search index", async () => {
    respond = () => ({
      query: {
        pages: {
          1: { index: 1, title: "Series", fullurl: "s", description: "film series" },
          2: { index: 2, title: "Movie", fullurl: "m", description: "1982 film" },
        },
      },
    });
    expect((await searchFilms("x", sys)).map((r) => r.title)).toEqual(["Movie", "Series"]);
  });
});
