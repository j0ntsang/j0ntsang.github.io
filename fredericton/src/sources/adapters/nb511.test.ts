import { describe, expect, it } from "vitest";
import { city } from "@/city/fredericton";
import { decodePolyline, highwayAlerts, kmFromCity, toHighways, type HighwayEvent } from "./nb511";

const near = { Latitude: city.lat + 0.1, Longitude: city.lon };
const far = { Latitude: 47.0, Longitude: -65.5 }; // Miramichi area

describe("kmFromCity", () => {
  it("is about 11 km for a tenth of a degree of latitude", () => {
    expect(kmFromCity(city.lat + 0.1, city.lon)).toBeCloseTo(11.1, 0);
  });
});

/** One-point Google encoded polyline, the inverse of decodePolyline. */
function encode({ Latitude, Longitude }: { Latitude: number; Longitude: number }) {
  const one = (v: number) => {
    let n = Math.round(v * 1e5);
    n = n < 0 ? ~(n << 1) : n << 1;
    let out = "";
    while (n >= 0x20) {
      out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    return out + String.fromCharCode(n + 63);
  };
  return one(Latitude) + one(Longitude);
}

describe("decodePolyline", () => {
  it("decodes Google's reference example", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ]);
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
    expect(out[0]).toMatchObject({ road: "Route 2", direction: "westbound", fullClosure: true, end: "2026-11-20T12:00:00.000Z" });
  });

  it("reads NB's directions as words that follow a road name", () => {
    const dirs = ["South", "Both", "Unknown", "Westbound"].map((DirectionOfTravel, i) => ({ ID: i, DirectionOfTravel, ...near }));
    expect(toHighways(dirs, []).events.map((e) => e.direction)).toEqual(["southbound", "both ways", null, "westbound"]);
  });

  it("reads Unix-second timestamps", () => {
    expect(toHighways(events, []).events[1].updated).toBe(new Date(1795000000 * 1000).toISOString());
  });

  it("joins primary and secondary conditions and ignores far-away roads", () => {
    const conditions = [
      { RoadwayName: "Route 7", AreaName: "Fredericton", "Primary Condition": "Partly snow covered", "Secondary Conditions": ["Icy patches"], EncodedPolyline: [encode(far), encode(near)] },
      { RoadwayName: "Route 17", "Primary Condition": "Bare dry", EncodedPolyline: encode(far) },
      { RoadwayName: "No line", "Primary Condition": "Bare dry" },
    ];
    expect(toHighways([], conditions).conditions).toEqual([
      { road: "Route 7", where: "Fredericton", condition: "Partly snow covered, Icy patches", updated: null },
    ]);
  });

  it("rejects a response that isn't a list", () => {
    expect(() => toHighways({ Message: "Invalid Key" }, [])).toThrow();
  });
});

describe("highwayAlerts", () => {
  const now = new Date("2026-11-19T12:00:00Z");
  const base: HighwayEvent = { id: "", road: null, direction: null, description: null, kind: null, fullClosure: false, lanes: null, start: null, end: null, updated: null };
  const alerts = (events: Partial<HighwayEvent>[]) => highwayAlerts(events.map((e, i) => ({ ...base, id: String(i), ...e })), now).map((e) => e.id);

  it("flags full closures ending within 30 days or with no end", () => {
    expect(alerts([{ fullClosure: true, end: "2026-12-15T13:00:00Z" }, { fullClosure: true }, { fullClosure: true, end: "2034-03-03T15:26:00Z" }])).toEqual(["0", "1"]);
  });

  it("flags accidents and incidents, but not roadwork", () => {
    expect(alerts([{ kind: "accidentsAndIncidents" }, { kind: "roadwork" }])).toEqual(["0"]);
  });
});

