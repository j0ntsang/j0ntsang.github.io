import "./october.css";

import { CSSProperties, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import { DayEditor } from "./DayEditor";
import {
  addMovie,
  allMovies,
  DAYS_IN_OCTOBER,
  firstWeekday,
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
  /** Whether this visitor has a saved copy of the year (something to reset). */
  hasLocalChanges(year: number): Promise<boolean>;
  /** Drop the saved copy, revealing the shipped file again. */
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

  // Reset asks twice; the second click has to come within a few seconds.
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

function DayCell({ year, day, movies, wiki, brokenPosters, onPosterError, isActive, buttonRef, onFocus, onToggle, onEdit }: DayCellProps) {
  const tonight = isTonight(year, day);
  const when = `${weekdayOf(year, day)}, October ${day}`;
  const tabIndex = isActive ? 0 : -1;
  const multi = movies.length > 1;

  const classes = [
    "october__cell",
    tonight && "october__cell--tonight",
    !movies.length && "october__cell--empty",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classes}>
      {/* Top overlay: the date (and the add button) sit over the posters. */}
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
                {/* Bottom overlay: the title over the poster. */}
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
          <button
            ref={buttonRef}
            type="button"
            className="october__toggle"
            tabIndex={tabIndex}
            aria-label={`${when}: no movie${tonight ? " (tonight)" : ""}. Add a movie`}
            onFocus={onFocus}
            onClick={onEdit}
          />
          <span className="october__hint" aria-hidden="true">+ add</span>
        </>
      )}
    </li>
  );
}

/** Chain-link glyph drawn in the text colour, so it inherits the title's contrast. */
function LinkIcon() {
  return (
    <svg className="october__link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}
