// /usr/bin/october — movie-a-day calendar.
//
//   october            this year, in a window
//   october 2025       another year (an empty calendar if there's no file)
//   october --list     text mode: print the month to the terminal
//
// Data lives at ~/october/<year>.json. The shipped copy is read-only; your
// cross-offs are copied up into the overlay. `rm` the file to reset it.

import { OctoberCalendar } from "../apps/october/OctoberCalendar";
import { allMovies, emptyYear, firstWeekday, moviesOn, OctoberYear, weekdayOf, wikiTitle, yearPath } from "../apps/october/model";
import { rememberWiki, resolveWiki, searchFilms } from "../apps/october/wiki";
import { mountReact } from "../os/display/toolkits/react";
import { C, link } from "../os/lib/ansi";
import type { Sys } from "../os/kernel/syscalls";

const USAGE = "usage: october [year] [--list]\n";

async function load(sys: Sys, year: number): Promise<OctoberYear> {
  try {
    return JSON.parse(await sys.readFile(yearPath(year)));
  } catch (err) {
    if ((await sys.stat(yearPath(year))) === null) return emptyYear(year);
    throw err;
  }
}

async function list(sys: Sys, data: OctoberYear) {
  const titles = allMovies(data).map(wikiTitle).filter((t): t is string => !!t);
  const wiki = await resolveWiki(titles, sys).catch(() => ({}) as Record<string, null>);

  sys.write(`${C.bold}October ${data.year}${C.reset}${data.theme ? `  ${C.dim}${data.theme}${C.reset}` : ""}\n`);
  sys.write(`${C.dim}starts on a ${weekdayOf(data.year, 1)} (offset ${firstWeekday(data.year)})${C.reset}\n\n`);

  const days = Object.keys(data.days).map(Number).sort((a, b) => a - b);
  if (!days.length) sys.write(`${C.dim}No movies yet — edit ${yearPath(data.year)}${C.reset}\n`);

  for (const day of days) {
    moviesOn(data, day).forEach((entry, i) => {
      const lookup = wikiTitle(entry);
      const page = lookup ? wiki[lookup] : null;
      const title = page ? link(page.url, entry.title) : entry.title;
      const mark = entry.watched ? `${C.red}✗${C.reset}` : " ";
      const styled = entry.watched ? `${C.strike}${C.dim}${title}${C.reset}` : title;
      const note = entry.note ? `  ${C.dim}${entry.note}${C.reset}` : "";
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

  const surface = sys.createWindow({ title: `october — ${year}` });
  mountReact(
    surface,
    <OctoberCalendar
      initialYear={year}
      load={(y) => load(sys, y)}
      save={(data) => sys.writeFile(yearPath(data.year), JSON.stringify(data, null, 2) + "\n")}
      resolve={(titles) => resolveWiki(titles, sys)}
      remember={(pages) => rememberWiki(pages, sys)}
      search={(query) => searchFilms(query, sys)}
      setTitle={surface.setTitle}
      yearPathOf={yearPath}
    />,
  );
  await surface.closed;
  return 0;
}
