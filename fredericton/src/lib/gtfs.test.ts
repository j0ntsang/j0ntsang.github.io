import { describe, expect, it } from "vitest";
import { buildTimetable, nextDepartures, parseCsv } from "./gtfs";

const feed = {
  "routes.txt": "﻿route_id,route_short_name,route_long_name\n10N,10N,\n11S,11S,\n",
  "trips.txt": "route_id,service_id,trip_id,trip_headsign\n10N,WK,t1,DOWNTOWN\n10N,WK,t2,DOWNTOWN\n11S,SAT,t3,\"UNB, via Regent\"\n10N,WK,late,DOWNTOWN\n",
  "stops.txt": "stop_id,stop_name\nA,Kings  Place\nB,Regent and/et Prospect\nC,Terminal\n",
  "stop_times.txt": [
    "trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type",
    "t1,08:00:00,08:00:00,A,1,0",
    "t1,08:10:00,08:10:00,C,2,0",
    "t2,09:30:00,09:30:00,A,1,0",
    "t2,09:40:00,09:40:00,C,2,0",
    "t3,10:00:00,10:00:00,A,1,1",
    "t3,10:05:00,10:05:00,B,2,0",
    "t3,10:15:00,10:15:00,C,3,0",
    "late,24:20:00,24:20:00,A,1,0",
    "late,24:30:00,24:30:00,C,2,0",
  ].join("\r\n"),
  // Weekday service runs Wed 18 and Thu 19 Nov; Saturday service on the 21st.
  "calendar_dates.txt": "service_id,date,exception_type\nWK,20261118,1\nWK,20261119,1\nSAT,20261121,1\n",
};

const tt = buildTimetable(feed);
const stop = (id: string) => tt.stops.findIndex((s) => s.id === id);

describe("parseCsv", () => {
  it("handles quoted commas, doubled quotes, CRLF and a byte-order mark", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([{ a: "x, y", b: 'say "hi"' }]);
  });
});

describe("buildTimetable", () => {
  it("spans the feed's service days", () => {
    expect([tt.feedStart, tt.feedEnd]).toEqual(["2026-11-18", "2026-11-21"]);
  });

  it("tidies stop names", () => {
    expect(tt.stops[stop("A")].name).toBe("Kings Place");
  });

  it("leaves out a trip's last stop and stops with no pickup", () => {
    expect(tt.departures[stop("C")]).toEqual([]);
    expect(nextDepartures(tt, stop("A"), "2026-11-21", 0)).toEqual([]);
  });
});

describe("nextDepartures", () => {
  it("lists today's departures after now, soonest first", () => {
    expect(nextDepartures(tt, stop("A"), "2026-11-18", 8 * 60 + 5)).toEqual([
      { route: "10N", headsign: "DOWNTOWN", minute: 570, minutesAway: 85 },
      { route: "10N", headsign: "DOWNTOWN", minute: 1460, minutesAway: 975 },
    ]);
  });

  it("includes yesterday's after-midnight trips, on today's clock", () => {
    expect(nextDepartures(tt, stop("A"), "2026-11-19", 10)[0]).toMatchObject({ minute: 20, minutesAway: 10 });
  });

  it("skips days a service doesn't run", () => {
    expect(nextDepartures(tt, stop("B"), "2026-11-18", 0)).toEqual([]);
    expect(nextDepartures(tt, stop("B"), "2026-11-21", 0)).toEqual([{ route: "11S", headsign: "UNB, via Regent", minute: 605, minutesAway: 605 }]);
  });

  it("returns at most `count`", () => {
    expect(nextDepartures(tt, stop("A"), "2026-11-18", 0, 1)).toHaveLength(1);
  });
});
