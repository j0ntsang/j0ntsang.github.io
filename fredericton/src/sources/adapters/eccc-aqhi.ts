import { z } from "zod";
import { city } from "@/city/fredericton";
import { collect } from "@/lib/envelope";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

const def = sourceById["eccc-aqhi"];

const Observations = z.object({
  features: z.array(z.object({ properties: z.object({ observation_datetime: z.string(), aqhi: z.number() }) })).min(1),
});

export type AqhiRisk = "Low" | "Moderate" | "High" | "Very high";
export type Aqhi = { value: number; risk: AqhiRisk };

// Health Canada AQHI categories: 1–3 low, 4–6 moderate, 7–10 high, 10+ very high.
export function aqhiRisk(value: number): AqhiRisk {
  const rounded = Math.round(value);
  if (rounded <= 3) return "Low";
  if (rounded <= 6) return "Moderate";
  if (rounded <= 10) return "High";
  return "Very high";
}

export function getAqhi() {
  return collect<Aqhi>(def.id, async () => {
    const url = `https://api.weather.gc.ca/collections/aqhi-observations-realtime/items?f=json&location_id=${city.eccc.aqhiLocationId}&sortby=-observation_datetime&limit=1`;
    const json = await (await fetchUpstream(url)).json();
    const p = Observations.parse(json).features[0].properties;
    return { observedAt: p.observation_datetime, data: { value: p.aqhi, risk: aqhiRisk(p.aqhi) } };
  });
}
