import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { yearProblem } from "../model";

const DIR = join(__dirname, "../../../../rootfs/usr/share/october");
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));

/** Day-level keys in the raw text, to catch duplicates that JSON.parse silently collapses. */
function dayKeys(raw: string): string[] {
  const keys: string[] = [];
  const daysAt = raw.indexOf('"days"');
  let depth = 0;
  for (let i = raw.indexOf("{", daysAt); i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      const end = raw.indexOf('"', i + 1);
      if (depth === 1 && raw[end + 1] === ":") keys.push(raw.slice(i + 1, end));
      i = end;
    } else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") if (--depth === 0) break;
  }
  return keys;
}

describe("shipped october calendars", () => {
  it("exist", () => expect(files.length).toBeGreaterThan(0));

  describe.each(files)("%s", (file) => {
    const raw = readFileSync(join(DIR, file), "utf8");

    it("parses and passes the model's validator", () => {
      const data = JSON.parse(raw);
      expect(yearProblem(data)).toBeNull();
    });

    it("has a year matching the filename", () => {
      expect(JSON.parse(raw).year).toBe(Number(file.replace(".json", "")));
    });

    it("has unique integer day keys from 1 to 31", () => {
      const keys = dayKeys(raw);
      expect(keys.length).toBeGreaterThan(0);
      expect(new Set(keys).size).toBe(keys.length);
      for (const k of keys) {
        expect(k).toMatch(/^\d+$/);
        expect(Number(k)).toBeGreaterThanOrEqual(1);
        expect(Number(k)).toBeLessThanOrEqual(31);
      }
    });

    it("has only known fields on every movie, with non-empty titles", () => {
      const { days } = JSON.parse(raw);
      for (const entry of Object.values<any>(days)) {
        const movies = Array.isArray(entry) ? entry : Object.keys(entry).length ? [entry] : [];
        for (const m of movies) {
          expect(m.title.trim()).not.toBe("");
          expect(Object.keys(m).filter((k) => !["title", "wiki", "watched", "note"].includes(k))).toEqual([]);
          if ("watched" in m) expect(typeof m.watched).toBe("boolean");
          if ("note" in m) expect(typeof m.note).toBe("string");
        }
      }
    });
  });
});
