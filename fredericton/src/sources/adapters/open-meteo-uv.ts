import { z } from "zod";
import { city } from "@/city/fredericton";
import { collect } from "@/lib/envelope";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

const def = sourceById["open-meteo-uv"];

const Forecast = z.object({
  utc_offset_seconds: z.number(),
  current: z.object({ time: z.string(), uv_index: z.number() }),
  daily: z.object({ uv_index_max: z.array(z.number()).min(1) }),
});

export type Uv = { now: number; todayMax: number };

export function getUv() {
  return collect<Uv>(def.id, async () => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=uv_index&daily=uv_index_max&forecast_days=1&timezone=${encodeURIComponent(city.timeZone)}`;
    const f = Forecast.parse(await (await fetchUpstream(url)).json());
    // Open-Meteo returns local wall time without an offset.
    const observedAt = new Date(Date.parse(`${f.current.time}Z`) - f.utc_offset_seconds * 1000).toISOString();
    return { observedAt, data: { now: f.current.uv_index, todayMax: f.daily.uv_index_max[0] } };
  });
}
