import { z } from "zod";
import { city } from "@/city/fredericton";
import { collect } from "@/lib/envelope";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

/*
 * NB 511 (511.gnb.ca/developers/doc): GET /api/v2/get/{event,roadconditions}?key=…&format=json,
 * throttled to 10 calls a minute. The key is a secret, so this runs only in the snapshot job.
 *
 * The field names below are the ones 511 v2 deployments share. They haven't been checked
 * against NB's own response yet: do that with a real key before switching the registry
 * entry to "connected". The schemas are lenient (optional fields, extra fields ignored)
 * so a missing field drops a detail rather than the whole card.
 */

const def = sourceById["nb511"];
const API = "https://511.gnb.ca/api/v2/get";
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

const RoadCondition = z.object({
  RoadwayName: z.string().nullish(),
  LocationDescription: z.string().nullish(),
  Condition: z.union([z.string(), z.array(z.string())]).nullish(),
  LastUpdated: when,
  Latitude: z.number().nullish(),
  Longitude: z.number().nullish(),
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

/** Pure, for tests: the raw API arrays → what the card shows, near Fredericton only, full closures first. */
export function toHighways(rawEvents: unknown, rawConditions: unknown): Highways {
  const events = z
    .array(Event)
    .parse(rawEvents)
    .filter(nearby)
    .map((e) => ({
      id: e.ID,
      road: e.RoadwayName ?? null,
      direction: e.DirectionOfTravel ?? null,
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
    .filter(nearby)
    .map((c) => ({
      road: c.RoadwayName ?? null,
      where: c.LocationDescription ?? null,
      condition: [c.Condition ?? []].flat().join(", ") || "Unknown",
      updated: c.LastUpdated,
    }));

  return { events, conditions };
}

export function getHighways(key: string) {
  return collect<Highways>(def.id, async () => {
    // The key is in the URL; fetchUpstream's errors name only the host, so it never reaches the JSON.
    const get = (what: string) => fetchUpstream(`${API}/${what}?key=${encodeURIComponent(key)}&format=json&lang=en`).then((r) => r.json());
    const [events, conditions] = await Promise.all([get("event"), get("roadconditions")]);
    // A quiet day has no recent updates, so the reading's time is when 511 was checked; each item keeps its own.
    return { observedAt: new Date().toISOString(), timeBasis: "checked", data: toHighways(events, conditions) };
  });
}
