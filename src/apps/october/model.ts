// october/model — the year file format and pure date helpers.

export interface MovieDay {
  /** Display name. */
  title: string;
  /** Wikipedia article for poster + link. Omitted → use `title`; null → no lookup. */
  wiki?: string | null;
  watched?: boolean;
  note?: string;
}

/** One movie, or a list when you watched several on the same day. */
export type DayEntry = MovieDay | MovieDay[];

export interface OctoberYear {
  year: number;
  theme?: string;
  days: Record<string, DayEntry>;
}

export const DAYS_IN_OCTOBER = 31;
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const emptyYear = (year: number): OctoberYear => ({ year, days: {} });

export const yearPath = (year: number) => `~/october/${year}.json`;

/** 0 = Sunday. October is month index 9. */
export const firstWeekday = (year: number) => new Date(year, 9, 1).getDay();

export const weekdayOf = (year: number, day: number) => WEEKDAYS[new Date(year, 9, day).getDay()];

export function isTonight(year: number, day: number, now = new Date()) {
  return now.getFullYear() === year && now.getMonth() === 9 && now.getDate() === day;
}

export const wikiTitle = (entry: MovieDay) => (entry.wiki === null ? null : entry.wiki ?? entry.title);

export function moviesOn(data: OctoberYear, day: number): MovieDay[] {
  const entry = data.days[day];
  return !entry ? [] : Array.isArray(entry) ? entry : [entry];
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
function withMovies(data: OctoberYear, day: number, movies: MovieDay[]): OctoberYear {
  const days = { ...data.days };
  if (!movies.length) delete days[day];
  else days[day] = movies.length === 1 ? movies[0] : movies;
  return { ...data, days };
}

export const addMovie = (data: OctoberYear, day: number, movie: MovieDay) =>
  withMovies(data, day, [...moviesOn(data, day), movie]);

export const removeMovie = (data: OctoberYear, day: number, index: number) =>
  withMovies(data, day, moviesOn(data, day).filter((_, i) => i !== index));

/** "Carrie (1976 film)" → "Carrie" */
export const displayTitle = (wikiPageTitle: string) => wikiPageTitle.replace(/\s*\([^)]*\b(film|movie)\)$/i, "");
