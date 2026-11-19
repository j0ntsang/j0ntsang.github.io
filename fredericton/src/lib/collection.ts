import zoneData from "@/data/collection-zones.json";

/**
 * Sources:
 * - Zones: City of Fredericton ArcGIS "Garbage" layer (scripts/build-collection-zones.mjs).
 * - Garbage rules: fredericton.ca garbage-collection page — curb by 7:00 a.m.; collected on all
 *   holidays except Christmas Day and New Year's Day.
 * - Recycling: Circular Materials "City of Fredericton & New Maryland recycling calendar 2026-2027"
 *   (same day as garbage, alternating Blue/Grey weeks) and the "Capital Region" calendar
 *   (Carlisle Road, Pepper Creek, Killarney Road: Week A only). Week A coincides with Blue weeks.
 */
export const CALENDAR = {
  blueWeekMonday: "2026-11-09",
  validThrough: "2027-12-31",
  curbTime: "7:00 a.m.",
  calendarUrl: "https://www.circularmaterials.ca/resident-communities/fredericton/",
  cityMapUrl: "https://www.fredericton.ca/resident-services/garbage-recycling-waste-reduction/garbage-collection",
  serviceFredericton: "506-460-2020",
} as const;

/** Holiday moves printed on the Fredericton recycling calendar. */
const RECYCLING_SHIFTS: Record<string, string> = {
  "2026-12-25": "2026-12-26",
  "2027-01-01": "2027-01-02",
};

/** Per the City: no garbage collection on these days. The make-up day isn't published on the page. */
const isNoGarbageDay = (iso: string) => iso.endsWith("-12-25") || iso.endsWith("-01-01");

export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export type Zone = {
  id: string;
  name: string;
  garbageDay: Weekday | null;
  recycling: { kind: "alternating" | "week-a"; day: Weekday };
};

export type CollectionLocation = {
  id: string;
  name: string;
  kind: "street" | "neighbourhood" | "rural";
  /** More than one when the location crosses a zone boundary. */
  zoneIds: string[];
};

export const zones = zoneData.zones as Zone[];
export const locations = zoneData.locations as CollectionLocation[];
export const zoneById = (id: string | undefined) => zones.find((z) => z.id === id) ?? null;
export const locationById = (id: string | undefined) => locations.find((l) => l.id === id) ?? null;

export type Pickup = {
  kind: "garbage" | "recycling";
  date: string;
  /** Bin colour for alternating zones; null for Week A rural recycling (both bins). */
  bin?: "Blue" | "Grey" | null;
  movedFrom?: string;
  note?: string;
};

const DAY_INDEX: Record<Weekday, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
export const DAY_MS = 86_400_000;

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => toIso(new Date(toDate(iso).getTime() + n * DAY_MS));

function mondayOf(iso: string): string {
  const dow = toDate(iso).getUTCDay();
  return addDays(iso, -((dow + 6) % 7));
}

/** Blue weeks (and Capital Region Week A) are even fortnights from the anchor. */
export function isBlueWeek(iso: string): boolean {
  const weeks = Math.round((toDate(mondayOf(iso)).getTime() - toDate(CALENDAR.blueWeekMonday).getTime()) / (7 * DAY_MS));
  return ((weeks % 2) + 2) % 2 === 0;
}

function* weekdaysFrom(today: string, day: Weekday) {
  const offset = (DAY_INDEX[day] - toDate(today).getUTCDay() + 7) % 7;
  for (let d = addDays(today, offset); d <= CALENDAR.validThrough; d = addDays(d, 7)) yield d;
}

function garbagePickups(zone: Zone, today: string): Pickup[] {
  if (!zone.garbageDay) return [];
  return [...weekdaysFrom(today, zone.garbageDay)].map((date) =>
    isNoGarbageDay(date)
      ? { kind: "garbage", date, note: `No garbage pickup this day. Call Service Fredericton (${CALENDAR.serviceFredericton}) for the make-up day.` }
      : { kind: "garbage", date },
  );
}

function recyclingPickups(zone: Zone, today: string): Pickup[] {
  const out: Pickup[] = [];
  for (const scheduled of weekdaysFrom(addDays(today, -1), zone.recycling.day)) {
    const blue = isBlueWeek(scheduled);
    if (zone.recycling.kind === "week-a" && !blue) continue;
    const shifted = zone.recycling.kind === "alternating" ? RECYCLING_SHIFTS[scheduled] : undefined;
    const date = shifted ?? scheduled;
    if (date < today) continue;
    out.push({
      kind: "recycling",
      date,
      bin: zone.recycling.kind === "alternating" ? (blue ? "Blue" : "Grey") : null,
      movedFrom: shifted ? scheduled : undefined,
    });
  }
  return out;
}

export function schedule(zone: Zone, today: string) {
  const garbage = garbagePickups(zone, today);
  const recycling = recyclingPickups(zone, today);
  return {
    nextGarbage: garbage[0] ?? null,
    nextRecycling: recycling[0] ?? null,
    upcomingRecycling: recycling.slice(0, 4),
    expired: today > CALENDAR.validThrough,
  };
}
