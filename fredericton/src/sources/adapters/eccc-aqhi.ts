import { z } from "zod";
import { city } from "@/city/fredericton";
import { collect } from "@/lib/envelope";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

const def = sourceById["eccc-aqhi"];

const Observations = z.object({
  features: z.array(z.object({ properties: z.object({ observation_datetime: z.string(), aqhi: z.number() }) })).min(1),
});

/** Hourly rows carry forecast_datetime and aqhi; the "AQHI-Forecast-Period" summary rows mixed in don't. */
const Forecasts = z.object({
  features: z.array(
    z.object({
      properties: z.object({ publication_datetime: z.string(), forecast_datetime: z.string().optional(), aqhi: z.number().optional() }),
    }),
  ),
});

export type AqhiRisk = "Low" | "Moderate" | "High" | "Very high";
/** The worst forecast hour in the next day, from ECCC's latest forecast. */
export type AqhiOutlook = { value: number; risk: AqhiRisk; at: string };
export type Aqhi = { value: number; risk: AqhiRisk; outlook: AqhiOutlook | null };

const DAY_MS = 24 * 3600_000;

// Health Canada AQHI categories: 1–3 low, 4–6 moderate, 7–10 high, 10+ very high.
export function aqhiRisk(value: number): AqhiRisk {
  const rounded = Math.round(value);
  if (rounded <= 3) return "Low";
  if (rounded <= 6) return "Moderate";
  if (rounded <= 10) return "High";
  return "Very high";
}

/** Pure, for tests: the highest forecast hour within a day of `now`, from the newest publication only. */
export function peakOutlook(forecasts: z.infer<typeof Forecasts>, now = Date.now()): AqhiOutlook | null {
  const rows = forecasts.features
    .map((f) => f.properties)
    .filter((r): r is { publication_datetime: string; forecast_datetime: string; aqhi: number } => r.forecast_datetime !== undefined && r.aqhi !== undefined);
  const latest = rows.reduce((max, r) => (r.publication_datetime > max ? r.publication_datetime : max), "");
  const upcoming = rows.filter((r) => {
    const t = Date.parse(r.forecast_datetime);
    return r.publication_datetime === latest && t >= now && t <= now + DAY_MS;
  });
  if (upcoming.length === 0) return null;
  const peak = upcoming.reduce((a, b) => (b.aqhi > a.aqhi ? b : a));
  return { value: peak.aqhi, risk: aqhiRisk(peak.aqhi), at: peak.forecast_datetime };
}

/** The outlook is extra: if it fails, the card still shows the observation. */
async function getOutlook(): Promise<AqhiOutlook | null> {
  try {
    // A publication covers ~48 hourly forecasts; two cover the hand-over between them.
    const url = `https://api.weather.gc.ca/collections/aqhi-forecasts-realtime/items?f=json&location_id=${city.eccc.aqhiLocationId}&sortby=-publication_datetime&limit=100`;
    return peakOutlook(Forecasts.parse(await (await fetchUpstream(url)).json()));
  } catch (err) {
    console.error(`[source:${def.id}]`, "forecast unavailable:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export function getAqhi() {
  return collect<Aqhi>(def.id, async () => {
    const url = `https://api.weather.gc.ca/collections/aqhi-observations-realtime/items?f=json&location_id=${city.eccc.aqhiLocationId}&sortby=-observation_datetime&limit=1`;
    const [json, outlook] = await Promise.all([fetchUpstream(url).then((r) => r.json()), getOutlook()]);
    const p = Observations.parse(json).features[0].properties;
    return { observedAt: p.observation_datetime, data: { value: p.aqhi, risk: aqhiRisk(p.aqhi), outlook } };
  });
}
