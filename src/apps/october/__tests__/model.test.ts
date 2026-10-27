import { describe, expect, it } from "vitest";
import {
  addMovie, copyProblem, diffYears, displayTitle, editsFromLegacy, EDITS_VERSION, mergeYears, moviesOn,
  OctoberEdits, OctoberYear, removeMovie, toggleWatched, yearProblem,
} from "../model";

const clue = { title: "Clue", wiki: "Clue (film)" };
const carrie = { title: "Carrie", wiki: "Carrie (1976 film)", watched: true };
const ginger = { title: "Ginger Snaps", wiki: "Ginger Snaps" };

const shipped: OctoberYear = {
  year: 2026,
  days: { 1: carrie, 20: {}, 27: clue, 29: ginger, 30: [{ title: "A" }, { title: "B" }] },
};
const edits = (days: OctoberEdits["days"]): OctoberEdits => ({ version: EDITS_VERSION, year: 2026, days });

describe("mergeYears", () => {
  it("returns the shipped calendar when there are no edits", () => {
    expect(mergeYears(shipped, edits({}))).toEqual(shipped);
  });

  it("joins an added movie to a shipped day after the shipped ones", () => {
    const merged = mergeYears(shipped, edits({ 27: { added: [{ title: "Scream" }] } }));
    expect(moviesOn(merged, 27).map((m) => m.title)).toEqual(["Clue", "Scream"]);
  });

  it("makes up a missed day when a movie is added to it", () => {
    const merged = mergeYears(shipped, edits({ 20: { added: [{ title: "Saw", watched: true }] } }));
    expect(merged.days[20]).toEqual({ title: "Saw", watched: true });
  });

  it("counts a cross-off in your edits", () => {
    const merged = mergeYears(shipped, edits({ 27: { crossedOff: [{ title: "Clue", wiki: "Clue (film)" }] } }));
    expect(moviesOn(merged, 27)[0].watched).toBe(true);
  });

  it("keeps a shipped cross-off even when your edits don't mention it", () => {
    expect(moviesOn(mergeYears(shipped, edits({ 1: {} })), 1)[0].watched).toBe(true);
  });

  it("matches movies case-insensitively by wiki page, else title", () => {
    const merged = mergeYears(shipped, edits({ 27: { crossedOff: [{ title: "x", wiki: "clue (FILM)" }] } }));
    expect(moviesOn(merged, 27)[0].watched).toBe(true);
  });

  it("applies removals", () => {
    const merged = mergeYears(shipped, edits({ 29: { removed: [{ title: "Ginger Snaps", wiki: "Ginger Snaps" }] } }));
    expect(merged.days[29]).toBeUndefined();
  });

  it("lets shipped field fixes win over what an edit remembers", () => {
    const fixed: OctoberYear = { year: 2026, days: { 27: { title: "Clue (1985)", wiki: "Clue (film)", note: "new" } } };
    const merged = mergeYears(fixed, edits({ 27: { crossedOff: [{ title: "Clue", wiki: "Clue (film)" }] } }));
    expect(merged.days[27]).toEqual({ title: "Clue (1985)", wiki: "Clue (film)", note: "new", watched: true });
  });

  it("ignores a stale reference to a shipped movie that moved or was dropped", () => {
    // finding 1: the old pick shouldn't resurrect or hide anything
    const moved: OctoberYear = { year: 2026, days: { 28: clue } };
    const merged = mergeYears(moved, edits({ 27: { removed: [clue], crossedOff: [clue] } }));
    expect(merged).toEqual(moved);
  });
});

describe("diffYears", () => {
  it("returns no day edits when nothing changed", () => {
    expect(diffYears(shipped, shipped)).toEqual(edits({}));
  });

  it("round-trips: merging the diff reproduces the session", () => {
    let session = toggleWatched(shipped, 27, 0);
    session = addMovie(session, 27, { title: "Scream", wiki: null });
    session = addMovie(session, 20, { title: "Saw", watched: true });
    session = removeMovie(session, 30, 0);
    session = removeMovie(session, 29, 0);
    session = addMovie(session, 5, { title: "New" });
    expect(mergeYears(shipped, diffYears(shipped, session))).toEqual(session);
  });

  it("records adds, cross-offs and removals separately", () => {
    let session = toggleWatched(shipped, 27, 0);
    session = addMovie(session, 27, { title: "Scream" });
    session = removeMovie(session, 29, 0);
    const { days } = diffYears(shipped, session);
    expect(days[27]).toEqual({ added: [{ title: "Scream" }], crossedOff: [{ title: "Clue", wiki: "Clue (film)" }] });
    expect(days[29]).toEqual({ removed: [{ title: "Ginger Snaps", wiki: "Ginger Snaps" }] });
  });
});

describe("editsFromLegacy", () => {
  const legacy: OctoberYear = {
    year: 2026,
    days: {
      24: [{ title: "Obsession", wiki: "Obsession (2025 film)", watched: true }, { title: "Other Mommy" }],
      27: { ...clue, watched: true },
      28: { title: "Old pick" },
    },
  };
  const s: OctoberYear = {
    year: 2026,
    days: { 24: { title: "Obsession", wiki: "Obsession (2025 film)" }, 27: clue, 25: {} },
  };

  it("keeps cross-offs of shipped movies and drops everything else", () => {
    expect(editsFromLegacy(s, legacy)).toEqual(
      edits({
        24: { crossedOff: [{ title: "Obsession", wiki: "Obsession (2025 film)" }] },
        27: { crossedOff: [{ title: "Clue", wiki: "Clue (film)" }] },
      }),
    );
  });

  it("keeps every movie as an addition when there is no shipped calendar", () => {
    const { days } = editsFromLegacy(null, legacy);
    expect(days[28]).toEqual({ added: [{ title: "Old pick" }] });
    expect(days[24].added).toHaveLength(2);
  });
});

describe("shape validators", () => {
  it("accepts good years", () => {
    expect(yearProblem(shipped)).toBeNull();
    expect(yearProblem({ year: 2026, days: {} })).toBeNull();
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["no year", { days: {} }],
    ["string year", { year: "2026", days: {} }],
    ["no days", { year: 2026 }],
  ])("rejects a year with %s", (_n, data) => {
    expect(yearProblem(data)).toBe("not an october calendar");
  });

  it("names the bad day and rejects typo'd keys and non-string wiki", () => {
    expect(yearProblem({ year: 2026, days: { 3: { tittle: "x" } } })).toMatch(/^day 3 /);
    expect(yearProblem({ year: 2026, days: { 4: { title: "x", wiki: 5 } } })).toMatch(/^day 4 /);
    expect(yearProblem({ year: 2026, days: { 5: [{ title: "x" }, {}] } })).toMatch(/^day 5 /);
  });

  it("accepts good copies, both versions", () => {
    expect(copyProblem(edits({ 25: { added: [{ title: "x" }], removed: [] } }))).toBeNull();
    expect(copyProblem({ year: 2026, days: { 1: carrie } })).toBeNull();
  });

  it("rejects bad copies", () => {
    expect(copyProblem(null)).toMatch(/not an october copy/);
    expect(copyProblem({ version: 3, year: 2026, days: {} })).toMatch(/not an october copy/);
    expect(copyProblem({ version: 2, year: 2026 })).toMatch(/not an october copy/);
    expect(copyProblem(edits({ 5: { added: [{ nope: 1 }] as never } }))).toMatch(/^day 5 /);
    expect(copyProblem({ year: 2026, days: { 1: { bad: true } } })).toMatch(/^day 1 /);
  });
});

describe("day helpers", () => {
  it("toggleWatched keeps the single-object or list shape", () => {
    expect(toggleWatched(shipped, 27, 0).days[27]).toEqual({ ...clue, watched: true });
    expect(toggleWatched(shipped, 1, 0).days[1]).toEqual({ title: "Carrie", wiki: "Carrie (1976 film)" });
    expect(Array.isArray(toggleWatched(shipped, 30, 1).days[30])).toBe(true);
  });

  it("removing the last movie deletes the day; two become a list, one an object", () => {
    expect(removeMovie(shipped, 27, 0).days[27]).toBeUndefined();
    expect(removeMovie(shipped, 30, 0).days[30]).toEqual({ title: "B" });
  });

  it("displayTitle only strips a trailing '(… film)'", () => {
    expect(displayTitle("Carrie (1976 film)")).toBe("Carrie");
    expect(displayTitle("Clue (film)")).toBe("Clue");
    expect(displayTitle("Scream (TV series)")).toBe("Scream (TV series)");
    expect(displayTitle("Film Noir")).toBe("Film Noir");
  });
});
