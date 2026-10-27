// /usr/bin/october — movie-a-day calendar.
//
//   october            this year, in a window
//   october 2025       another year (an empty calendar if there's no file)
//   october --list     text mode: print the month to the terminal
//
// The shipped calendar is /usr/share/october/<year>.json (read-only). Your
// changes to it (movies added or removed, cross-offs) are saved to
// ~/october/<year>.json and applied on top of it, so updates to the shipped
// file still show; reset drops your copy.

import { OctoberCalendar } from "../apps/october/OctoberCalendar";
import {
  allMovies,
  copyProblem,
  diffYears,
  editsFromLegacy,
  emptyYear,
  firstWeekday,
  isLegacyCopy,
  isMissed,
  legacyCopyPath,
  localCopyPath,
  mergeYears,
  moviesOn,
  OctoberEdits,
  OctoberYear,
  shippedPath,
  toJson,
  weekdayOf,
  wikiTitle,
  YearFileError,
  yearProblem,
} from "../apps/october/model";
import { rememberWiki, resolveWiki, searchFilms } from "../apps/october/wiki";
import { mountReact } from "../os/display/toolkits/react";
import { C, link } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

const USAGE = "usage: october [year] [--list]\n";

/** A year file or your copy, or null if there's none. Errors name the file. */
async function readChecked<T>(sys: Sys, path: string, problemWith: (data: unknown) => string | null): Promise<T | null> {
  if ((await sys.stat(path)) === null) return null;
  const text = await sys.readFile(path);
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new YearFileError(path, `invalid JSON (${(err as Error).message})`);
  }
  const problem = problemWith(data);
  if (problem) throw new YearFileError(path, problem);
  return data as T;
}

const readShipped = (sys: Sys, year: number) => readChecked<OctoberYear>(sys, shippedPath(year), yearProblem);

async function load(sys: Sys, year: number): Promise<OctoberYear> {
  const shipped = await readShipped(sys, year);
  const copy = await readChecked<OctoberYear | OctoberEdits>(sys, localCopyPath(year), copyProblem);
  const base = shipped ?? emptyYear(year);
  if (!copy) return base;
  return mergeYears(base, "version" in copy ? copy : editsFromLegacy(shipped, copy));
}

/**
 * Before an older october's copy (a whole year) is rewritten or reset, keep it
 * at legacyCopyPath: converting it drops movies that may have been yours.
 */
async function keepLegacyCopy(sys: Sys, year: number) {
  const path = localCopyPath(year);
  if (!(await sys.stat(path)) || (await sys.stat(legacyCopyPath(year)))) return;
  const text = await sys.readFile(path);
  try {
    if (!isLegacyCopy(JSON.parse(text))) return;
  } catch {
    return; // Not JSON: nothing worth keeping.
  }
  await sys.writeFile(legacyCopyPath(year), text);
}

/** Save only what `data` changes about the shipped calendar. */
async function save(sys: Sys, data: OctoberYear) {
  await keepLegacyCopy(sys, data.year);
  const shipped = (await readShipped(sys, data.year)) ?? emptyYear(data.year);
  await sys.writeFile(localCopyPath(data.year), toJson(diffYears(shipped, data)));
}

async function list(sys: Sys, data: OctoberYear) {
  const titles = allMovies(data).map(wikiTitle).filter((t): t is string => !!t);
  const wikiPages = await resolveWiki(titles, sys).catch(() => ({}) as Record<string, null>);

  sys.write(`${C.bold}October ${data.year}${C.reset}${data.theme ? `  ${C.dim}${data.theme}${C.reset}` : ""}\n`);
  sys.write(`${C.dim}starts on a ${weekdayOf(data.year, 1)} (offset ${firstWeekday(data.year)})${C.reset}\n\n`);

  const days = Object.keys(data.days).map(Number).sort((a, b) => a - b);
  if (!days.length) sys.write(`${C.dim}No movies yet — add some with october ${data.year}${C.reset}\n`);

  for (const day of days) {
    if (isMissed(data, day)) sys.write(`${C.red}✗${C.reset} ${weekdayOf(data.year, day)} ${String(day).padStart(2)}  ${C.red}missed${C.reset}\n`);
    moviesOn(data, day).forEach((movie, i) => {
      const articleTitle = wikiTitle(movie);
      const page = articleTitle ? wikiPages[articleTitle] : null;
      const title = page ? link(page.url, movie.title) : movie.title;
      const mark = movie.watched ? `${C.red}✗${C.reset}` : " ";
      const styled = movie.watched ? `${C.strike}${C.dim}${title}${C.reset}` : title;
      const note = movie.note ? `  ${C.dim}${movie.note}${C.reset}` : "";
      const date = i === 0 ? `${weekdayOf(data.year, day)} ${String(day).padStart(2)}` : "      ";
      sys.write(`${mark} ${date}  ${styled}${note}\n`);
    });
  }
}

export default async function october(argv: string[], sys: Sys) {
  const args = argv.slice(1);
  if (args.includes("-h") || args.includes("--help")) {
    sys.write(USAGE);
    return 0;
  }

  const yearArg = args.find((a) => !a.startsWith("-"));
  const year = yearArg ? Number(yearArg) : new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    sys.error(`october: invalid year '${yearArg}'\n${USAGE}`);
    return 2;
  }

  if (args.includes("--list")) {
    await list(sys, await load(sys, year));
    return 0;
  }

  const surface = sys.createWindow({ title: `october — ${year}`, maximized: true, theme: "october" });
  mountReact(
    surface,
    <OctoberCalendar
      initialYear={year}
      load={(y) => load(sys, y)}
      save={(data) => save(sys, data)}
      hasLocalChanges={async (y) => !!(await sys.stat(localCopyPath(y)))}
      reset={async (y) => {
        await keepLegacyCopy(sys, y);
        if (await sys.stat(localCopyPath(y))) await sys.unlink(localCopyPath(y));
      }}
      resolve={(titles) => resolveWiki(titles, sys)}
      remember={(pages) => rememberWiki(pages, sys)}
      search={(query) => searchFilms(query, sys)}
      setTitle={surface.setTitle}
    />,
  );
  await surface.closed;
  return 0;
}
