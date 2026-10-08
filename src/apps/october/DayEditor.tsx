import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

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
const optionId = (i: number) => `october-option-${i}`;

export function DayEditor({ year, day, movies, wiki, search, onAdd, onRemove, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(0);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
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
    const id = ++latest.current;
    if (q.trim().length < 2) return setState({ status: "idle" });
    setState({ status: "loading" });
    search(q.trim())
      .then((results) => {
        if (id !== latest.current) return;
        setState({ status: "done", results });
        setSelected(0);
        setTitleDraft(null);
      })
      .catch(() => id === latest.current && setState({ status: "error" }));
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
    // runSearch only closes over stable props and refs.
  }, [query]);

  const results = state.status === "done" ? state.results : [];
  const article: FilmResult | undefined = results[selected];
  const title = titleDraft ?? (article ? displayTitle(article.title) : query.trim());
  const optionCount = state.status === "done" ? results.length + 1 : 0;

  const select = (i: number) => {
    setSelected(i);
    setTitleDraft(null);
  };

  const save = (e?: FormEvent) => {
    e?.preventDefault();
    // Enter before results arrive searches now instead of saving an article-less title.
    if (state.status === "loading" || (state.status === "idle" && query.trim().length >= 2)) return runSearch(query);
    if (!title.trim()) return;
    onAdd({ title: title.trim(), wiki: article?.title ?? null }, article);
    latest.current++;
    setQuery("");
    setTitleDraft(null);
    setState({ status: "idle" });
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

      <form className="october__editor-body" id="october-editor-form" onSubmit={save}>
        {movies.length > 0 && (
          <fieldset>
            <legend>On this day</legend>
            <ul className="october__editor-list">
              {movies.map((movie, i) => {
                const lookup = wikiTitle(movie);
                const poster = lookup ? wiki[lookup]?.poster : undefined;
                return (
                  <li key={`${movie.title}-${i}`}>
                    <Poster src={poster} />
                    <span>
                      <strong>{movie.title}</strong>
                      <small>{lookup ?? "No Wikipedia article"}</small>
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
            {state.status === "idle" && <p>Type at least two letters.</p>}
            {state.status === "loading" && <p>Searching…</p>}
            {state.status === "error" && <p>Search failed. Check your connection and try again.</p>}
            {state.status === "done" && (
              <ul role="listbox" id="october-results" aria-label="Wikipedia articles">
                {results.map((r, i) => (
                  <li
                    key={r.title}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === selected}
                    onClick={() => select(i)}
                    onDoubleClick={() => save()}
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
                  onDoubleClick={() => save()}
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
