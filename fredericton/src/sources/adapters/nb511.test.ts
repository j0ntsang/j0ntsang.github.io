import { describe, expect, it } from "vitest";
import { city } from "@/city/fredericton";
import { kmFromCity, toHighways } from "./nb511";

const near = { Latitude: city.lat + 0.1, Longitude: city.lon };
const far = { Latitude: 47.0, Longitude: -65.5 }; // Miramichi area

describe("kmFromCity", () => {
  it("is about 11 km for a tenth of a degree of latitude", () => {
    expect(kmFromCity(city.lat + 0.1, city.lon)).toBeCloseTo(11.1, 0);
  });
});

describe("toHighways", () => {
  const events = [
    { ID: 1, RoadwayName: "Route 8", Description: "Roadwork", IsFullClosure: false, LastUpdated: 1795000000, ...near },
    { ID: "2", RoadwayName: "Route 2", DirectionOfTravel: "Westbound", IsFullClosure: true, PlannedEndDate: "2026-11-20T12:00:00Z", ...near },
    { ID: 3, RoadwayName: "Route 11", ...far },
    { ID: 4, RoadwayName: "No position" },
  ];

  it("keeps events near Fredericton, full closures first", () => {
    const { events: out } = toHighways(events, []);
    expect(out.map((e) => e.id)).toEqual(["2", "1"]);
    expect(out[0]).toMatchObject({ road: "Route 2", direction: "Westbound", fullClosure: true, end: "2026-11-20T12:00:00.000Z" });
  });

  it("reads Unix-second timestamps", () => {
    expect(toHighways(events, []).events[1].updated).toBe(new Date(1795000000 * 1000).toISOString());
  });

  it("joins listed conditions and ignores far-away ones", () => {
    const conditions = [
      { RoadwayName: "Route 7", Condition: ["Partly snow covered", "Icy patches"], ...near },
      { RoadwayName: "Route 17", Condition: "Bare dry", ...far },
    ];
    expect(toHighways([], conditions).conditions).toEqual([
      { road: "Route 7", where: null, condition: "Partly snow covered, Icy patches", updated: null },
    ]);
  });

  it("rejects a response that isn't a list", () => {
    expect(() => toHighways({ Message: "Invalid Key" }, [])).toThrow();
  });
});
