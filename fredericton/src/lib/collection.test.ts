import { describe, expect, it } from "vitest";
import { isBlueWeek, locationById, locations, schedule, zoneById, type Zone } from "./collection";

describe("locations", () => {
  it("have unique ids (the combobox drops duplicates)", () => {
    expect(new Set(locations.map((l) => l.id)).size).toBe(locations.length);
  });

  it("all point at known zones", () => {
    expect(locations.flatMap((l) => l.zoneIds).every((z) => zoneById(z))).toBe(true);
  });
});

describe("locationById", () => {
  it("returns null for an unknown id", () => {
    expect(locationById("no-such-location")).toBeNull();
  });

  it("returns null when no id is given", () => {
    expect(locationById(undefined)).toBeNull();
  });
});

const bundledZone = (id: string) => zoneById(id) as Zone;

// Expected values read off the Circular Materials 2026–27 Fredericton and Capital Region calendars.
describe("isBlueWeek", () => {
  it.each([
    ["2026-11-09", true],
    ["2026-11-18", false],
    ["2026-11-27", true],
    ["2027-01-04", true],
    ["2027-03-31", true],
    ["2027-12-20", true],
    ["2027-12-27", false],
  ])("treats the week of %s as a Blue week: %s", (date, blue) => expect(isBlueWeek(date)).toBe(blue));
});

describe("schedule for a city zone", () => {
  it("returns today when today is collection day", () => {
    const pickups = schedule(bundledZone("wednesday"), "2026-11-18");
    expect(pickups.nextGarbage?.date).toBe("2026-11-18");
    expect(pickups.nextRecycling).toMatchObject({ date: "2026-11-18", bin: "Grey" });
  });

  it("rolls to next week after collection day", () => {
    const pickups = schedule(bundledZone("monday"), "2026-11-18");
    expect(pickups.nextGarbage?.date).toBe("2026-11-23");
    expect(pickups.nextRecycling).toMatchObject({ date: "2026-11-23", bin: "Blue" });
  });

  it("moves Christmas recycling to Saturday and flags garbage", () => {
    const pickups = schedule(bundledZone("friday"), "2026-12-22");
    expect(pickups.nextRecycling).toMatchObject({ date: "2026-12-26", bin: "Blue", movedFrom: "2026-12-25" });
    expect(pickups.nextGarbage?.date).toBe("2026-12-25");
    expect(pickups.nextGarbage?.note).toMatch(/No garbage pickup/);
  });

  it("still shows a holiday move on the moved-to day", () => {
    expect(schedule(bundledZone("friday"), "2026-12-26").nextRecycling?.date).toBe("2026-12-26");
  });

  it("moves New Year's Day to January 2", () => {
    expect(schedule(bundledZone("friday"), "2026-12-30").nextRecycling).toMatchObject({ date: "2027-01-02", movedFrom: "2027-01-01" });
  });

  it("marks the calendar expired after December 2027", () => {
    expect(schedule(bundledZone("monday"), "2028-01-03").expired).toBe(true);
  });
});

describe("schedule for a Capital Region road (Week A only)", () => {
  const killarney = () => schedule(bundledZone("killarney-road"), "2026-11-18");

  it("has no garbage pickup", () => {
    expect(killarney().nextGarbage).toBeNull();
  });

  it("lists only Week A Thursdays, two weeks apart", () => {
    expect(killarney().upcomingRecycling.map((p) => p.date)).toEqual(["2026-11-26", "2026-12-10", "2026-12-24", "2027-01-07"]);
  });

  it("has no bin colour since both bins go out", () => {
    expect(killarney().nextRecycling).toMatchObject({ date: "2026-11-26", bin: null });
  });
});
