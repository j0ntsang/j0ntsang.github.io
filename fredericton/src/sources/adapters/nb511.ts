import { z } from "zod";
import { city } from "@/city/fredericton";
import { collect } from "@/lib/envelope";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

/*
 * NB 511 (511.gnb.ca/developers/doc): GET /api/v2/get/event and /api/v3/get/winterroads,
 * ?key=…&format=json, throttled to 10 calls a minute. The key is a secret, so this runs only
 * in the snapshot job. Field names follow 511.gnb.ca/help/endpoint/{event,winterroads}.
 * The schemas are lenient (optional fields, extra fields ignored) so a missing field drops
 * a detail rather than the whole card.
 */

const def = sourceById["nb511"];
const EVENTS_URL = "https://511.gnb.ca/api/v2/get/event";
const WINTER_ROADS_URL = "https://511.gnb.ca/api/v3/get/winterroads";
/** Events farther than this from the city centre aren't "Fredericton" news. */
export const NEARBY_KM = 50;

/** 511 platforms send Unix seconds, or occasionally ISO strings. */
const when = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => (v == null || v === "" ? null : new Date(typeof v === "number" ? v * 1000 : v).toISOString()));

const Event = z.object({
  ID: z.union([z.string(), z.number()]).transform(String),
  RoadwayName: z.string().nullish(),
  DirectionOfTravel: z.string().nullish(),
  Description: z.string().nullish(),
  EventType: z.string().nullish(),
  IsFullClosure: z.boolean().nullish(),
  LanesAffected: z.string().nullish(),
  StartDate: when,
  PlannedEndDate: when,
  LastUpdated: when,
  Latitude: z.number().nullish(),
  Longitude: z.number().nullish(),
});

const conditionText = z.union([z.string(), z.array(z.string())]).nullish();

/** Winter roads segments carry no point, only the road's line as Google encoded polylines (one per piece). */
const RoadCondition = z.object({
  RoadwayName: z.string().nullish(),
  LocationDescription: z.string().nullish(),
  AreaName: z.string().nullish(),
  "Primary Condition": conditionText,
  "Secondary Conditions": conditionText,
  LastUpdated: when,
  EncodedPolyline: z.union([z.string(), z.array(z.string())]).nullish(),
});

export type HighwayEvent = {
  id: string;
  road: string | null;
  direction: string | null;
  description: string | null;
  kind: string | null;
  fullClosure: boolean;
  lanes: string | null;
  start: string | null;
  end: string | null;
  updated: string | null;
};
export type HighwayCondition = { road: string | null; where: string | null; condition: string; updated: string | null };
export type Highways = { events: HighwayEvent[]; conditions: HighwayCondition[] };

/** Great-circle distance in km. */
export function kmFromCity(lat: number, lon: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat - city.lat) * rad;
  const dLon = (lon - city.lon) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(city.lat * rad) * Math.cos(lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const nearby = (r: { Latitude?: number | null; Longitude?: number | null }) =>
  r.Latitude != null && r.Longitude != null && kmFromCity(r.Latitude, r.Longitude) <= NEARBY_KM;

/** Google's encoded polyline format (precision 5) → [lat, lon] pairs. */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let i = 0;
  let lat = 0;
  let lon = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(i++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && i < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < encoded.length) {
    lat += next();
    lon += next();
    points.push([lat / 1e5, lon / 1e5]);
  }
  return points;
}

const lineNearby = (r: { EncodedPolyline?: string | string[] | null }) =>
  [r.EncodedPolyline ?? []].flat().some((line) => decodePolyline(line).some(([lat, lon]) => kmFromCity(lat, lon) <= NEARBY_KM));

/** NB sends "North", "Both", "Unknown"…; road names read better with "northbound", "both ways" or nothing. */
function direction(raw: string | null | undefined): string | null {
  const d = raw?.trim().toLowerCase();
  if (!d || d === "unknown" || d === "none") return null;
  if (d === "both") return "both ways";
  return /^(north|south|east|west)$/.test(d) ? `${d}bound` : d;
}

/** Bare and dry is the normal state, so the card summarizes those sections instead of listing them. */
export const isClear = (c: HighwayCondition) => /^bare,? dry$/i.test(c.condition.trim());

/** Pure, for tests: the raw API arrays → what the card shows, near Fredericton only, full closures first. */
export function toHighways(rawEvents: unknown, rawConditions: unknown): Highways {
  const events = z
    .array(Event)
    .parse(rawEvents)
    .filter(nearby)
    .map((e) => ({
      id: e.ID,
      road: e.RoadwayName ?? null,
      direction: direction(e.DirectionOfTravel),
      description: e.Description ?? null,
      kind: e.EventType ?? null,
      fullClosure: e.IsFullClosure ?? false,
      lanes: e.LanesAffected ?? null,
      start: e.StartDate,
      end: e.PlannedEndDate,
      updated: e.LastUpdated,
    }))
    .sort((a, b) => Number(b.fullClosure) - Number(a.fullClosure) || (b.updated ?? "").localeCompare(a.updated ?? ""));

  const conditions = z
    .array(RoadCondition)
    .parse(rawConditions)
    .filter(lineNearby)
    .map((c) => ({
      road: c.RoadwayName ?? null,
      where: c.LocationDescription ?? c.AreaName ?? null,
      condition: [c["Primary Condition"] ?? [], c["Secondary Conditions"] ?? []].flat().filter(Boolean).join(", ") || "Unknown",
      updated: c.LastUpdated,
    }));

  return { events, conditions };
}

/** Long-running closures (bridges out for years) aren't news; flag the ones ending soon or with no end. */
export const ALERT_WITHIN_DAYS = 30;

/** Pure, for tests: the highway events worth a line in "Needs attention". */
export function highwayAlerts(events: HighwayEvent[], now = new Date()): HighwayEvent[] {
  const horizon = now.getTime() + ALERT_WITHIN_DAYS * 86_400_000;
  const incident = (e: HighwayEvent) => /accident|incident/i.test(e.kind ?? "");
  const shortClosure = (e: HighwayEvent) => e.fullClosure && (e.end == null || new Date(e.end).getTime() <= horizon);
  return events.filter((e) => incident(e) || shortClosure(e));
}

export function getHighways(key: string) {
  return collect<Highways>(def.id, async () => {
    // The key is in the URL; fetchUpstream's errors name only the host, so it never reaches the JSON.
    const get = (url: string) => fetchUpstream(`${url}?key=${encodeURIComponent(key)}&format=json&lang=en`).then((r) => r.json());
    const [events, conditions] = await Promise.all([get(EVENTS_URL), get(WINTER_ROADS_URL)]);
    // A quiet day has no recent updates, so the reading's time is when 511 was checked; each item keeps its own.
    return { observedAt: new Date().toISOString(), timeBasis: "checked", data: toHighways(events, conditions) };
  });
}
