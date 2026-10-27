// october/model — the year file format, your copy's format, and pure date helpers.

export interface Movie {
  /** Display name. */
  title: string;
  /** Wikipedia article for poster + link. Omitted → use `title`; null → no lookup. */
  wiki?: string | null;
  watched?: boolean;
  note?: string;
}

/** `{}` in the year file: a day you missed. */
export type MissedDay = Record<string, never>;

/** One movie, a list when you watched several on the same day, or a missed day. */
export type DayEntry = Movie | Movie[] | MissedDay;

export interface OctoberYear {
  year: number;
  theme?: string;
  days: Record<string, DayEntry>;
}

/** A shipped movie, named by the fields sameMovie compares. */
export type MovieRef = Pick<Movie, "title" | "wiki">;

/** What you changed about one day of the shipped calendar. */
export interface DayEdits {
  /** Movies you added, with their own watched flag. */
  added?: Movie[];
  /** Shipped movies you crossed off. */
  crossedOff?: MovieRef[];
  /** Shipped movies you removed. */
  removed?: MovieRef[];
}

export const EDITS_VERSION = 2;

/**
 * Your copy holds only your changes, so edits to the shipped file (a movie
 * moved or dropped) still show. A copy with no version is a whole year, saved
 * by an older october.
 */
export interface OctoberEdits {
  version: typeof EDITS_VERSION;
  year: number;
  days: Record<string, DayEdits>;
}

export const DAYS_IN_OCTOBER = 31;
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const emptyYear = (year: number): OctoberYear => ({ year, days: {} });

/** Your copy: your changes to the shipped calendar, saved in the /home overlay. */
export const localCopyPath = (year: number) => `~/october/${year}.json`;

/** Where an older october's copy is kept before it's converted to edits. */
export const legacyCopyPath = (year: number) => `~/october/${year}.legacy.json`;

/** The read-only calendar shipped with the build. */
export const shippedPath = (year: number) => `/usr/share/october/${year}.json`;

export const toJson = (data: OctoberYear | OctoberEdits) => JSON.stringify(data, null, 2) + "\n";

/** A year file october can't use. Like FsError, the message starts with the path. */
export class YearFileError extends Error {
  constructor(public path: string, problem: string) {
    super(`${path}: ${problem}`);
  }
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

const isMovie = (x: unknown): x is Movie =>
  isRecord(x) && typeof x.title === "string" && (x.wiki == null || typeof x.wiki === "string");

const isMovieList = (x: unknown) => Array.isArray(x) && x.every(isMovie);

const isDayEntry = (x: unknown) => isMovie(x) || isMovieList(x) || (isRecord(x) && !Object.keys(x).length);

const isDayEdits = (x: unknown) =>
  isRecord(x) && [x.added, x.crossedOff, x.removed].every((list) => list === undefined || isMovieList(list));

/** Why a parsed year file can't be used, or null if it can. */
export function yearProblem(data: unknown): string | null {
  if (!isRecord(data) || typeof data.year !== "number" || !isRecord(data.days)) return "not an october calendar";
  const days = data.days;
  const day = Object.keys(days).find((d) => !isDayEntry(days[d]));
  return day ? `day ${day} isn't a movie with a title, a list of them, or {}` : null;
}

export const isLegacyCopy = (data: unknown) => isRecord(data) && !("version" in data);

/** Why a parsed copy of yours can't be used, or null if it can. */
export function copyProblem(data: unknown): string | null {
  if (isLegacyCopy(data)) return yearProblem(data);
  if (!isRecord(data) || data.version !== EDITS_VERSION || typeof data.year !== "number" || !isRecord(data.days)) {
    return `not an october copy (version ${EDITS_VERSION})`;
  }
  const days = data.days;
  const day = Object.keys(days).find((d) => !isDayEdits(days[d]));
  return day ? `day ${day} needs added, crossedOff or removed lists of movies` : null;
}

/** 0 = Sunday. October is month index 9. */
export const firstWeekday = (year: number) => new Date(year, 9, 1).getDay();

export const weekdayOf = (year: number, day: number) => WEEKDAYS[new Date(year, 9, day).getDay()];

export function isTonight(year: number, day: number, now = new Date()) {
  return now.getFullYear() === year && now.getMonth() === 9 && now.getDate() === day;
}

export const wikiTitle = (movie: Movie) => (movie.wiki === null ? null : movie.wiki ?? movie.title);

const isMissedEntry = (entry: DayEntry): entry is MissedDay =>
  !Array.isArray(entry) && Object.keys(entry).length === 0;

export function isMissed(data: OctoberYear, day: number) {
  const entry = data.days[day];
  return !!entry && isMissedEntry(entry);
}

export function moviesOn(data: OctoberYear, day: number): Movie[] {
  const entry = data.days[day];
  return !entry || isMissedEntry(entry) ? [] : Array.isArray(entry) ? entry : [entry];
}

export const allMovies = (data: OctoberYear) =>
  Object.keys(data.days).flatMap((day) => moviesOn(data, Number(day)));

/** Flip one movie's watched flag, keeping the day's single-object or list shape. */
export function toggleWatched(data: OctoberYear, day: number, index: number): OctoberYear {
  const entry = data.days[day];
  if (!entry) return data;
  const movies = moviesOn(data, day).map((movie, i) => {
    if (i !== index) return movie;
    const { watched, ...rest } = movie;
    return watched ? rest : { ...rest, watched: true };
  });
  return { ...data, days: { ...data.days, [day]: Array.isArray(entry) ? movies : movies[0] } };
}

/** Store a day as one object when it has one movie, a list for more, nothing when empty. */
function withMovies(data: OctoberYear, day: number, movies: Movie[]): OctoberYear {
  const days = { ...data.days };
  if (!movies.length) delete days[day];
  else days[day] = movies.length === 1 ? movies[0] : movies;
  return { ...data, days };
}

export const addMovie = (data: OctoberYear, day: number, movie: Movie) =>
  withMovies(data, day, [...moviesOn(data, day), movie]);

export const removeMovie = (data: OctoberYear, day: number, index: number) =>
  withMovies(data, day, moviesOn(data, day).filter((_, i) => i !== index));

/** "Carrie (1976 film)" → "Carrie" */
export const displayTitle = (wikiPageTitle: string) => wikiPageTitle.replace(/\s*\([^)]*\b(film|movie)\)$/i, "");

const sameMovie = (a: MovieRef, b: MovieRef) =>
  (a.wiki ?? a.title).toLowerCase() === (b.wiki ?? b.title).toLowerCase();

const isIn = (movies: MovieRef[], movie: MovieRef) => movies.some((m) => sameMovie(m, movie));

const ref = ({ title, wiki }: Movie): MovieRef => ({ title, wiki });

/**
 * The shipped calendar with your edits applied. Movies you removed are hidden,
 * a cross-off in either copy counts, and movies you added join their day after
 * the shipped ones; adding one to a missed day makes it up. Edits to movies
 * the shipped file has since moved or dropped match nothing, so its fixes
 * always show.
 */
export function mergeYears(shipped: OctoberYear, edits: OctoberEdits): OctoberYear {
  let merged = shipped;
  for (const [day, { added = [], crossedOff = [], removed = [] }] of Object.entries(edits.days)) {
    const theirs = moviesOn(shipped, Number(day));
    const watched = [...crossedOff, ...added.filter((movie) => movie.watched)];
    const kept = theirs
      .filter((movie) => !isIn(removed, movie))
      .map((movie) => (!movie.watched && isIn(watched, movie) ? { ...movie, watched: true } : movie));
    const extra = added.filter((movie) => !isIn(kept, movie));
    if (theirs.length || extra.length) merged = withMovies(merged, Number(day), [...kept, ...extra]);
  }
  return merged;
}

/** Your edits: what `data` changes about the shipped calendar. mergeYears turns them back into `data`. */
export function diffYears(shipped: OctoberYear, data: OctoberYear): OctoberEdits {
  const days: Record<string, DayEdits> = {};
  for (const day of Array.from(new Set([...Object.keys(shipped.days), ...Object.keys(data.days)]))) {
    const theirs = moviesOn(shipped, Number(day));
    const ours = moviesOn(data, Number(day));
    const watched = ours.filter((movie) => movie.watched);
    const added = ours.filter((movie) => !isIn(theirs, movie));
    const crossedOff = theirs.filter((movie) => !movie.watched && isIn(watched, movie)).map(ref);
    const removed = theirs.filter((movie) => !isIn(ours, movie)).map(ref);

    const edits: DayEdits = {};
    if (added.length) edits.added = added;
    if (crossedOff.length) edits.crossedOff = crossedOff;
    if (removed.length) edits.removed = removed;
    if (Object.keys(edits).length) days[day] = edits;
  }
  return { version: EDITS_VERSION, year: data.year, days };
}

/**
 * Edits from an older october's copy, which held the whole merged year. Its
 * cross-offs of shipped movies carry over. Its other movies may be yours or old
 * shipped picks since moved or dropped, with no telling which, so they're left
 * out (save and reset keep the original at legacyCopyPath). With no shipped
 * calendar, every movie in it is yours.
 */
export function editsFromLegacy(shipped: OctoberYear | null, legacy: OctoberYear): OctoberEdits {
  const edits = diffYears(shipped ?? emptyYear(legacy.year), legacy);
  if (!shipped) return edits;
  const days: Record<string, DayEdits> = {};
  for (const [day, { crossedOff }] of Object.entries(edits.days)) if (crossedOff) days[day] = { crossedOff };
  return { ...edits, days };
}
