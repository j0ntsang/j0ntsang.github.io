import { FormEvent, useEffect, useRef, useState } from "react";

import { displayTitle, MovieDay, weekdayOf, wikiTitle } from "./model";
import type { FilmResult, WikiIndex, WikiPage } from "./wiki";

interface Props {
  year: number;
  day: number;
  movies: MovieDay[];
  wiki: WikiIndex;
  search(query: string): Promise<FilmResult[]>;
  onAdd(movie: MovieDay, page?: WikiPage): void;
  onRemove(index: number): void;
  onClose(): void;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; results: FilmResult[] };

const DEBOUNCE_MS = 350;

export function DayEditor({ year, day, movies, wiki, search, onAdd, onRemove, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(0);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const heading = `${weekdayOf(year, day)}, October ${day}`;

  useEffect(() => {
    dialog.current?.showModal();
    // showModal() focuses the first button; start in the search box instead.
    input.current?.focus();
  }, []);

  const runSearch = (q: string) => {
    const id = ++latest.current;
    if (q.trim().length < 2) return setState({ status: "idle" });
    setState({ status: "loading" });
    search(q.trim())
      .then((results) => id === latest.current && setState({ status: "done", results }))
      .catch(() => id === latest.current && setState({ status: "error" }));
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
    // runSearch only closes over stable props and refs.
  }, [query]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const add = (movie: MovieDay, page?: WikiPage) => {
    onAdd(movie, page);
    latest.current++;
    setQuery("");
    setState({ status: "idle" });
    input.current?.focus();
  };

  return (
    <dialog
      ref={dialog}
      className="october__editor"
      aria-labelledby="october-editor-heading"
      onClose={onClose}
      // Keep keys (q, Esc, arrows) from reaching the calendar or the window manager.
      onKeyDown={(e) => e.stopPropagation()}
    >
      <header className="october__editor-header">
        <h2 id="october-editor-heading">{heading}</h2>
        <button type="button" className="october__nav" onClick={() => dialog.current?.close()}>
          Done
        </button>
      </header>

      {movies.length > 0 && (
        <ul className="october__editor-list" aria-label="Movies on this day">
          {movies.map((movie, i) => {
            const lookup = wikiTitle(movie);
            const poster = lookup ? wiki[lookup]?.poster : undefined;
            return (
              <li key={`${movie.title}-${i}`}>
                {poster ? <img src={poster} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" /> : <span className="october__editor-noposter" />}
                <span>{movie.title}</span>
                <button type="button" className="october__nav" onClick={() => onRemove(i)} aria-label={`Remove ${movie.title}`}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form role="search" onSubmit={submit} className="october__editor-search">
        <label htmlFor="october-search">{movies.length ? "Add another movie" : "Add a movie"}</label>
        <input
          ref={input}
          id="october-search"
          type="search"
          autoComplete="off"
          placeholder="Search Wikipedia by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="october__editor-results" aria-live="polite">
        {state.status === "loading" && <p>Searching…</p>}
        {state.status === "error" && <p>Search failed. Check your connection and try again.</p>}
        {state.status === "done" && (
          <>
            {state.results.length === 0 && <p>No matches on Wikipedia.</p>}
            <ul aria-label="Search results">
              {state.results.map((r) => (
                <li key={r.title}>
                  <button type="button" onClick={() => add({ title: displayTitle(r.title), wiki: r.title }, r)}>
                    {r.poster ? <img src={r.poster} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" loading="lazy" /> : <span className="october__editor-noposter" />}
                    <span>
                      <strong>{r.title}</strong>
                      {r.description && <small>{r.description}</small>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="october__nav" onClick={() => add({ title: query.trim(), wiki: null })}>
              Add “{query.trim()}” without a poster
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
