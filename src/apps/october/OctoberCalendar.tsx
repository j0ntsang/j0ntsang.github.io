import "./october.css";

import { CSSProperties, KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { DayEditor } from "./DayEditor";
import {
  addMovie,
  allMovies,
  DAYS_IN_OCTOBER,
  firstWeekday,
  isMissed,
  isTonight,
  MovieDay,
  moviesOn,
  OctoberYear,
  removeMovie,
  toJson,
  toggleWatched,
  weekdayOf,
  WEEKDAYS,
  wikiTitle,
} from "./model";
import type { FilmResult, WikiIndex, WikiPage } from "./wiki";

interface Props {
  initialYear: number;
  load(year: number): Promise<OctoberYear>;
  save(data: OctoberYear): Promise<void>;
  resolve(titles: string[]): Promise<WikiIndex>;
  remember(pages: WikiIndex): void;
  search(query: string): Promise<FilmResult[]>;
  setTitle(title: string): void;
  hasLocalChanges(year: number): Promise<boolean>;
  reset(year: number): Promise<void>;
}

const KEY_STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
const days = Array.from({ length: DAYS_IN_OCTOBER }, (_, i) => i + 1);

export function OctoberCalendar({ initialYear, load, save, resolve, remember, search, setTitle, hasLocalChanges, reset }: Props) {
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<OctoberYear | null>(null);
  const [wiki, setWiki] = useState<WikiIndex>({});
  const [wikiError, setWikiError] = useState(false);
  const [brokenPosters, setBrokenPosters] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(() => (isTonight(initialYear, new Date().getDate()) ? new Date().getDate() : 1));
  const [editing, setEditing] = useState<number | null>(null);
  const [modified, setModified] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let current = true;
    setTitle(`october — ${year}`);
    setData(null);
    setConfirmingReset(false);
    load(year).then((d) => current && setData(d));
    hasLocalChanges(year).then((m) => current && setModified(m));
    return () => {
      current = false;
    };
  }, [year, load, hasLocalChanges, setTitle]);

  useEffect(() => {
    if (!confirmingReset) return;
    const timer = setTimeout(() => setConfirmingReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingReset]);

  // Once the first year loads, put keyboard focus on today (or day 1).
  const focusedOnce = useRef(false);
  useEffect(() => {
    if (!data || focusedOnce.current) return;
    focusedOnce.current = true;
    buttons.current[active]?.focus();
  }, [data, active]);

  const titles = useMemo(
    () => (data ? allMovies(data).map(wikiTitle).filter((t): t is string => !!t) : []),
    [data],
  );
  const titleKey = titles.join("|");

  useEffect(() => {
    if (!titles.length) return;
    let current = true;
    resolve(titles)
      .then((index) => {
        if (!current) return;
        setWiki(index);
        setWikiError(false);
      })
      .catch(() => current && setWikiError(true));
    return () => {
      current = false;
    };
    // Keyed on titleKey, not `titles`, so toggling watched doesn't refetch.
  }, [titleKey, resolve]);

  const update = (next: OctoberYear) => {
    setData(next);
    setModified(true);
    save(next);
  };

  const clickReset = async () => {
    if (!confirmingReset) return setConfirmingReset(true);
    setConfirmingReset(false);
    await reset(year);
    setData(await load(year));
    setModified(false);
  };

  const exportYear = () => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob([toJson(data)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `october-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggle = (day: number, index: number) => data?.days[day] && update(toggleWatched(data, day, index));

  const add = (day: number, movie: MovieDay, page?: WikiPage) => {
    if (!data) return;
    if (movie.wiki && page) {
      const known = { [movie.wiki]: { url: page.url, poster: page.poster } };
      setWiki((prev) => ({ ...prev, ...known }));
      remember(known);
    }
    update(addMovie(data, day, movie));
  };

  const remove = (day: number, index: number) => data && update(removeMovie(data, day, index));

  const closeEditor = () => {
    const day = editing;
    setEditing(null);
    // The opener may have been re-rendered (an empty day gains a movie), so refocus by day.
    if (day) requestAnimationFrame(() => buttons.current[day]?.focus());
  };

  const moveFocus = (e: KeyboardEvent) => {
    const step = KEY_STEPS[e.key] ?? (e.key === "Home" ? 1 - active : e.key === "End" ? DAYS_IN_OCTOBER - active : 0);
    if (!step) return;
    const next = active + step;
    if (next < 1 || next > DAYS_IN_OCTOBER) return;
    e.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  };

  const entries = data ? allMovies(data) : [];
  const watchedCount = entries.filter((d) => d.watched).length;
  const missedCount = days.filter((day) => data && isMissed(data, day)).length;

  return (
    <div className="october">
      <header className="october__header">
        <button type="button" className="october__nav" onClick={() => setYear(year - 1)} aria-label={`Previous year, ${year - 1}`}>
          ‹ {year - 1}
        </button>
        <h1 className="october__heading">
          October <span className="october__year">{year}</span>
        </h1>
        <button type="button" className="october__nav" onClick={() => setYear(year + 1)} aria-label={`Next year, ${year + 1}`}>
          {year + 1} ›
        </button>
      </header>

      <div className="october__weekdays" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <ol className="october__grid" aria-label={`October ${year}`} aria-busy={!data} onKeyDown={moveFocus}>
        {Array.from({ length: firstWeekday(year) }, (_, i) => (
          <li key={`blank-${i}`} className="october__cell october__cell--blank" aria-hidden="true" />
        ))}
        {days.map((day) => (
          <DayCell
            key={day}
            year={year}
            day={day}
            movies={data ? moviesOn(data, day) : []}
            missed={!!data && isMissed(data, day)}
            wiki={wiki}
            brokenPosters={brokenPosters}
            onPosterError={(src) => setBrokenPosters((prev) => new Set(prev).add(src))}
            isActive={day === active}
            buttonRef={(el) => (buttons.current[day] = el)}
            onFocus={() => setActive(day)}
            onToggle={(index) => toggle(day, index)}
            onEdit={() => setEditing(day)}
          />
        ))}
      </ol>

      {editing !== null && data && (
        <DayEditor
          year={year}
          day={editing}
          movies={moviesOn(data, editing)}
          wiki={wiki}
          search={search}
          onAdd={(movie, page) => add(editing, movie, page)}
          onRemove={(index) => remove(editing, index)}
          onClose={closeEditor}
        />
      )}

      <footer className="october__footer">
        <span aria-live="polite">
          <span aria-hidden="true">🎃</span> {watchedCount} / {entries.length} watched
          {missedCount > 0 && ` · ${missedCount} missed`}
          {wikiError && " · posters unavailable (offline?)"}
        </span>
        <span className="october__actions">
          <button type="button" className="october__nav" onClick={exportYear} disabled={!data}>
            Export
          </button>
          <button
            type="button"
            className="october__nav"
            onClick={clickReset}
            disabled={!modified}
            title={modified ? "Drop your changes and go back to the shipped calendar" : "Nothing to reset"}
          >
            {confirmingReset ? "Click again to reset" : "Click to reset"}
          </button>
        </span>
      </footer>
    </div>
  );
}

interface DayCellProps {
  year: number;
  day: number;
  movies: MovieDay[];
  /** An empty `{}` day in the year file. */
  missed: boolean;
  wiki: WikiIndex;
  brokenPosters: Set<string>;
  onPosterError(src: string): void;
  isActive: boolean;
  /** Receives the day's first toggle, the roving-focus target for arrow keys. */
  buttonRef(el: HTMLButtonElement | null): void;
  onFocus(): void;
  onToggle(index: number): void;
  onEdit(): void;
}

function DayCell({ year, day, movies, missed, wiki, brokenPosters, onPosterError, isActive, buttonRef, onFocus, onToggle, onEdit }: DayCellProps) {
  const tonight = isTonight(year, day);
  const when = `${weekdayOf(year, day)}, October ${day}`;
  const tabIndex = isActive ? 0 : -1;
  const multi = movies.length > 1;

  const classes = [
    "october__cell",
    tonight && "october__cell--tonight",
    !movies.length && (missed ? "october__cell--missed" : "october__cell--empty"),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classes}>
      <span className="october__date" aria-hidden="true">
        {day}
      </span>
      {movies.length > 0 && (
        <button type="button" className="october__add" tabIndex={tabIndex} onClick={onEdit} aria-label={`Add or remove movies, ${when}`} title="Add or remove movies">
          +
        </button>
      )}
      {movies.length ? (
        <div
          className={`october__movies${multi ? " october__movies--multi" : ""}`}
          style={{ "--count": movies.length } as CSSProperties}
        >
          {movies.map((movie, i) => {
            const lookup = wikiTitle(movie);
            const page = lookup ? wiki[lookup] : null;
            const poster = page?.poster && !brokenPosters.has(page.poster) ? page.poster : null;
            return (
              <div key={i} className={`october__movie${movie.watched ? " october__movie--watched" : ""}`}>
                {poster && (
                  <img
                    className="october__poster"
                    src={poster}
                    alt=""
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={() => onPosterError(poster)}
                  />
                )}
                <button
                  ref={i === 0 ? buttonRef : undefined}
                  type="button"
                  className="october__toggle"
                  tabIndex={tabIndex}
                  title={movie.note}
                  aria-label={`${when}: ${movie.title}${movie.note ? `, ${movie.note}` : ""}${tonight ? " (tonight)" : ""}`}
                  aria-pressed={!!movie.watched}
                  onFocus={onFocus}
                  onClick={() => onToggle(i)}
                />
                <span className="october__title">
                  {page ? (
                    <a href={page.url} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex} title="Open on Wikipedia">
                      <LinkIcon />
                      {movie.title}
                    </a>
                  ) : (
                    movie.title
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {missed && <Blood />}
          <button
            ref={buttonRef}
            type="button"
            className="october__toggle"
            tabIndex={tabIndex}
            aria-label={`${when}: ${missed ? "missed" : "no movie"}${tonight ? " (tonight)" : ""}. Add a movie`}
            onFocus={onFocus}
            onClick={onEdit}
          />
          {missed ? (
            <span className="october__missed" aria-hidden="true">Missed</span>
          ) : (
            <span className="october__hint" aria-hidden="true">+ add</span>
          )}
        </>
      )}
    </li>
  );
}

/**
 * Drips as [left %, width px, reach, start s]. Reach is how far past the pool a
 * drip runs, as a fraction of the rest of the cell. The pool sags at the same
 * lefts, so each drip runs out of a low point.
 */
const DRIPS = [
  [9, 6, 0.25, 0.4],
  [24, 9, 0.6, 0],
  [41, 5, 0.12, 1.1],
  [57, 8, 0.75, 0.2],
  [73, 6, 0.38, 0.8],
  [88, 7, 0.5, 1.5],
] as const;

/** Drips that also shed drops: [index into DRIPS, seconds per drop]. */
const DROPS = [
  [1, 3.4],
  [3, 2.6],
  [5, 4.2],
] as const;

const GROW_S = 3.5;

/* 34px tall at the cell's full width, so y is px and x is %. Solid to y=26 everywhere, under the date. */
const POOL =
  "M0 0H100V28C94 28 94 33 88 33C84 33 84 27 80 27C76.5 27 76.5 32 73 32C69 32 69 28 65 28" +
  "C61 28 61 34 57 34C53 34 53 27 49 27C45 27 45 31 41 31C37 31 37 26 33 26" +
  "C28.5 26 28.5 33 24 33C20 33 20 28 16 28C12.5 28 12.5 32 9 32C4.5 32 4.5 28 0 28Z";

function dripStyle(i: number) {
  const [left, width, reach, start] = DRIPS[i];
  return { "--left": `${left}%`, "--width": `${width}px`, "--reach": reach, "--start": `${start}s` };
}

function Blood() {
  const gradient = `blood${useId().replace(/:/g, "")}`;
  return (
    <span className="october__blood" style={{ "--grow": `${GROW_S}s` } as CSSProperties} aria-hidden="true">
      {DRIPS.map((_, i) => (
        <span key={i} className="october__drip" style={dripStyle(i) as CSSProperties} />
      ))}
      {DROPS.map(([i, every]) => (
        <span
          key={i}
          className="october__drop"
          style={{ ...dripStyle(i), "--every": `${every}s`, "--wait": `${DRIPS[i][3] + GROW_S}s` } as CSSProperties}
        />
      ))}
      <svg className="october__pool" viewBox="0 0 100 34" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="october__pool-top" />
            <stop offset="1" className="october__pool-edge" />
          </linearGradient>
        </defs>
        <path d={POOL} fill={`url(#${gradient})`} />
      </svg>
    </span>
  );
}

function LinkIcon() {
  return (
    <svg className="october__link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}
