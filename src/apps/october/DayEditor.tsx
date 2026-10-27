import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { displayTitle, Movie, weekdayOf, wikiTitle } from "./model";
import type { FilmResult, WikiIndex, WikiPage } from "./wiki";

interface Props {
  year: number;
  day: number;
  movies: Movie[];
  wikiPages: WikiIndex;
  /** Why your last change wasn't saved; shown here too, since the modal hides the calendar's alert. */
  writeError: string | null;
  search(query: string): Promise<FilmResult[]>;
  onAdd(movie: Movie, page?: WikiPage): void;
  onRemove(index: number): void;
  onClose(): void;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; results: FilmResult[] };

const DEBOUNCE_MS = 350;
const optionId = (i: number) => `october-option-${i}`;

export function DayEditor({ year, day, movies, wikiPages, writeError, search, onAdd, onRemove, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const latestSearchId = useRef(0);
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle" });
  /** Index into the results; results.length is the trailing "no article" option. */
  const [selected, setSelected] = useState(0);
  /** null until the user types a title of their own. */
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const heading = `${weekdayOf(year, day)}, October ${day}`;

  useEffect(() => {
    dialog.current?.showModal();
    // showModal() focuses the first button; start in the search box instead.
    input.current?.focus();
  }, []);

  const runSearch = (q: string) => {
    const id = ++latestSearchId.current;
    if (q.trim().length < 2) return setSearchState({ status: "idle" });
    setSearchState({ status: "loading" });
    search(q.trim())
      .then((results) => {
        if (id !== latestSearchId.current) return;
        setSearchState({ status: "done", results });
        setSelected(0);
        setTitleDraft(null);
      })
      .catch(() => id === latestSearchId.current && setSearchState({ status: "error" }));
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
    // runSearch only closes over stable props and refs.
  }, [query]);

  const results = searchState.status === "done" ? searchState.results : [];
  const article: FilmResult | undefined = results[selected];
  const title = titleDraft ?? (article ? displayTitle(article.title) : query.trim());
  const optionCount = searchState.status === "done" ? results.length + 1 : 0;

  const select = (i: number) => {
    setSelected(i);
    setTitleDraft(null);
  };

  const submitPick = (e?: FormEvent) => {
    e?.preventDefault();
    // Enter before results arrive searches now instead of saving an article-less title.
    if (searchState.status === "loading" || (searchState.status === "idle" && query.trim().length >= 2)) return runSearch(query);
    if (!title.trim()) return;
    onAdd({ title: title.trim(), wiki: article?.title ?? null }, article);
    // Drop any search still in flight, so it can't refill the cleared form.
    latestSearchId.current++;
    setQuery("");
    setTitleDraft(null);
    setSearchState({ status: "idle" });
    input.current?.focus();
  };

  const moveSelection = (e: KeyboardEvent) => {
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!step || !optionCount) return;
    e.preventDefault();
    const next = (selected + step + optionCount) % optionCount;
    select(next);
    document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
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
      <header className="october__editor-titlebar">
        <h2 id="october-editor-heading">{heading}</h2>
        <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" title="Close (Esc)">
          [close]
        </button>
      </header>

      <form className="october__editor-body" id="october-editor-form" onSubmit={submitPick}>
        {movies.length > 0 && (
          <fieldset>
            <legend>On this day</legend>
            <ul className="october__editor-list">
              {movies.map((movie, i) => {
                const articleTitle = wikiTitle(movie);
                const poster = articleTitle ? wikiPages[articleTitle]?.poster : undefined;
                return (
                  <li key={`${movie.title}-${i}`}>
                    <Poster src={poster} />
                    <span>
                      <strong>{movie.title}</strong>
                      <small>{articleTitle ?? "No Wikipedia article"}</small>
                    </span>
                    <button type="button" className="october__nav" onClick={() => onRemove(i)} aria-label={`Remove ${movie.title}`}>
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}

        <fieldset>
          <legend>Add a movie</legend>

          <label htmlFor="october-search">Search Wikipedia titles</label>
          <input
            ref={input}
            id="october-search"
            type="search"
            role="combobox"
            aria-expanded={optionCount > 0}
            aria-controls="october-results"
            aria-activedescendant={optionCount ? optionId(selected) : undefined}
            autoComplete="off"
            placeholder="e.g. The Thing"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={moveSelection}
          />

          <div className="october__editor-results" aria-live="polite">
            {searchState.status === "idle" && <p>Type at least two letters.</p>}
            {searchState.status === "loading" && <p>Searching…</p>}
            {searchState.status === "error" && <p>Search failed. Check your connection and try again.</p>}
            {searchState.status === "done" && (
              <ul role="listbox" id="october-results" aria-label="Wikipedia articles">
                {results.map((r, i) => (
                  <li
                    key={r.title}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === selected}
                    onClick={() => select(i)}
                    onDoubleClick={() => submitPick()}
                  >
                    <Poster src={r.poster} lazy />
                    <span>
                      <strong>{r.title}</strong>
                      {r.description && <small>{r.description}</small>}
                    </span>
                  </li>
                ))}
                <li
                  id={optionId(results.length)}
                  role="option"
                  aria-selected={selected === results.length}
                  onClick={() => select(results.length)}
                  onDoubleClick={() => submitPick()}
                >
                  <Poster />
                  <span>
                    <strong>No Wikipedia article</strong>
                    <small>{results.length ? "Save the title without a poster or link" : "No titles matched"}</small>
                  </span>
                </li>
              </ul>
            )}
          </div>

          <label htmlFor="october-title">Title</label>
          <input id="october-title" type="text" autoComplete="off" value={title} onChange={(e) => setTitleDraft(e.target.value)} />
          <p className="october__editor-article">
            Wikipedia:{" "}
            {article ? (
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                {article.title}
              </a>
            ) : (
              "none"
            )}
          </p>
        </fieldset>
      </form>

      {writeError && (
        <div className="october__error" role="alert">
          <p>{writeError}</p>
        </div>
      )}

      <footer className="october__editor-footer">
        <button type="button" className="october__nav" onClick={() => dialog.current?.close()}>
          Close
        </button>
        <button type="submit" form="october-editor-form" className="october__nav october__nav--primary" disabled={!title.trim()}>
          Add
        </button>
      </footer>
    </dialog>
  );
}

function Poster({ src, lazy }: { src?: string; lazy?: boolean }) {
  return src ? (
    <img src={src} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" loading={lazy ? "lazy" : undefined} />
  ) : (
    <span className="october__editor-noposter" />
  );
}
