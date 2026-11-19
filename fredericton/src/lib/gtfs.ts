/*
 * Fredericton Transit's GTFS feed, boiled down to what "next bus at my stop" needs.
 * buildTimetable runs in the snapshot job (Node); nextDepartures runs in the browser.
 * The feed's 27k stop times shrink to a few hundred kB of numbers, loaded only on the
 * Transportation page.
 */

const DAY_MS = 86_400_000;
const MINUTES_PER_DAY = 1440;

export type Timetable = {
  /** First and last service days the feed covers, YYYY-MM-DD. */
  feedStart: string;
  feedEnd: string;
  routes: string[];
  headsigns: string[];
  /** Per service: the days it runs, as days after feedStart. */
  services: number[][];
  /** Per trip: [route index, headsign index, service index]. */
  trips: [number, number, number][];
  stops: { id: string; name: string }[];
  /**
   * Per stop (same order as `stops`): departures flattened as [trip, minute, trip, minute, …].
   * Minutes count from the service day's midnight and can pass 1440 for trips after midnight.
   */
  departures: number[][];
};

export type Departure = { route: string; headsign: string; minute: number; minutesAway: number };

/** RFC 4180 CSV: quoted fields, doubled quotes, CRLF, and a leading byte-order mark. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') (field += '"'), i++;
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") row.push(field), (field = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field), (field = "");
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);

  const [header = [], ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ""])));
}

const isoDate = (yyyymmdd: string) => `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
const daysBetween = (fromIso: string, toIso: string) => Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);

function minutesOf(hms: string): number {
  const [h, m] = hms.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) throw new Error(`bad GTFS time '${hms}'`);
  return h * 60 + m;
}

function indexer() {
  const list: string[] = [];
  const index = new Map<string, number>();
  const of = (value: string) => {
    let i = index.get(value);
    if (i === undefined) index.set(value, (i = list.push(value) - 1));
    return i;
  };
  return { list, of };
}

/** From the feed's text files (routes, trips, stops, stop_times, calendar_dates, optional calendar). */
export function buildTimetable(files: Record<string, string>): Timetable {
  const need = (name: string) => {
    if (files[name] === undefined) throw new Error(`GTFS feed has no ${name}`);
    return parseCsv(files[name]);
  };
  const routeNames = new Map(need("routes.txt").map((r) => [r.route_id, r.route_short_name || r.route_long_name || r.route_id]));

  // Service days. This feed lists every day in calendar_dates; calendar.txt is honoured too if present.
  const runs = new Map<string, Set<string>>();
  const dayOf = (id: string) => runs.get(id) ?? runs.set(id, new Set()).get(id)!;
  for (const c of files["calendar.txt"] ? parseCsv(files["calendar.txt"]) : []) {
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let d = isoDate(c.start_date); d <= isoDate(c.end_date); d = new Date(Date.parse(d) + DAY_MS).toISOString().slice(0, 10)) {
      if (c[weekdays[new Date(`${d}T00:00:00Z`).getUTCDay()]] === "1") dayOf(c.service_id).add(d);
    }
  }
  for (const c of need("calendar_dates.txt")) {
    if (c.exception_type === "1") dayOf(c.service_id).add(isoDate(c.date));
    else runs.get(c.service_id)?.delete(isoDate(c.date));
  }
  const allDays = [...runs.values()].flatMap((s) => [...s]).sort();
  if (allDays.length === 0) throw new Error("GTFS feed has no service days");
  const feedStart = allDays[0];
  const feedEnd = allDays[allDays.length - 1];

  const routes = indexer();
  const headsigns = indexer();
  const services = indexer();
  const trips: Timetable["trips"] = [];
  const tripIndex = new Map<string, number>();
  for (const t of need("trips.txt")) {
    if (!runs.has(t.service_id)) continue;
    tripIndex.set(t.trip_id, trips.length);
    trips.push([routes.of(routeNames.get(t.route_id) ?? t.route_id), headsigns.of(t.trip_headsign.trim()), services.of(t.service_id)]);
  }

  const stops = need("stops.txt").map((s) => ({ id: s.stop_id, name: s.stop_name.replace(/\s+/g, " ").trim() }));
  const stopIndex = new Map(stops.map((s, i) => [s.id, i]));

  // A trip's last stop is where it ends, not somewhere to catch it.
  const stopTimes = need("stop_times.txt");
  const lastSequence = new Map<string, number>();
  for (const st of stopTimes) lastSequence.set(st.trip_id, Math.max(lastSequence.get(st.trip_id) ?? -1, Number(st.stop_sequence)));

  const departures: number[][] = stops.map(() => []);
  for (const st of stopTimes) {
    const trip = tripIndex.get(st.trip_id);
    const stop = stopIndex.get(st.stop_id);
    if (trip === undefined || stop === undefined || st.pickup_type === "1") continue;
    if (Number(st.stop_sequence) === lastSequence.get(st.trip_id)) continue;
    departures[stop].push(trip, minutesOf(st.departure_time || st.arrival_time));
  }

  return {
    feedStart,
    feedEnd,
    routes: routes.list,
    headsigns: headsigns.list,
    services: services.list.map((id) => [...runs.get(id)!].map((d) => daysBetween(feedStart, d)).sort((a, b) => a - b)),
    trips,
    stops,
    departures,
  };
}

/**
 * The next `count` departures from a stop at `minute` past midnight on `date` (YYYY-MM-DD,
 * local to the city). Yesterday's service is included for its trips after midnight.
 */
export function nextDepartures(tt: Timetable, stopIndex: number, date: string, minute: number, count = 5): Departure[] {
  const today = daysBetween(tt.feedStart, date);
  const runsOn = tt.services.map((days) => new Set(days));
  const pairs = tt.departures[stopIndex] ?? [];
  const found: Departure[] = [];

  for (const daysBack of [0, 1]) {
    for (let i = 0; i < pairs.length; i += 2) {
      const [route, headsign, service] = tt.trips[pairs[i]];
      const at = pairs[i + 1] - daysBack * MINUTES_PER_DAY;
      if (at < minute || !runsOn[service].has(today - daysBack)) continue;
      found.push({ route: tt.routes[route], headsign: tt.headsigns[headsign], minute: at, minutesAway: at - minute });
    }
  }
  return found.sort((a, b) => a.minute - b.minute).slice(0, count);
}
