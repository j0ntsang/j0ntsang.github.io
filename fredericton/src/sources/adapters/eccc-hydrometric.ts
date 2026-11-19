import { z } from "zod";
import { city } from "@/city/fredericton";
import { collect } from "@/lib/envelope";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

const def = sourceById["eccc-hydrometric"];

const Hydrometric = z.object({
  features: z
    .array(z.object({ properties: z.object({ DATETIME: z.string(), LEVEL: z.number().nullable() }) }))
    .min(1),
});

export type RiverReading = { at: string; levelM: number };
export type River = {
  levelM: number;
  change6hM: number | null;
  floodStageM: number;
  history: RiverReading[];
};

const SIX_HOURS = 6 * 3600_000;

export function getRiver() {
  return collect<River>(def.id, async () => {
    // 5-minute readings: 600 covers ~50 hours.
    const url = `https://api.weather.gc.ca/collections/hydrometric-realtime/items?f=json&STATION_NUMBER=${city.eccc.hydrometricStation}&sortby=-DATETIME&limit=600&properties=DATETIME,LEVEL`;
    const json = await (await fetchUpstream(url)).json();
    const history = Hydrometric.parse(json)
      .features.map((f) => f.properties)
      .filter((p): p is { DATETIME: string; LEVEL: number } => p.LEVEL !== null)
      .map((p) => ({ at: p.DATETIME, levelM: p.LEVEL }))
      .reverse();
    if (history.length === 0) throw new Error("No level readings in the last 48 hours");

    const latest = history[history.length - 1];
    const sixHoursAgo = Date.parse(latest.at) - SIX_HOURS;
    const earlier = history.findLast((r) => Date.parse(r.at) <= sixHoursAgo);

    return {
      observedAt: latest.at,
      data: {
        levelM: latest.levelM,
        change6hM: earlier ? latest.levelM - earlier.levelM : null,
        floodStageM: city.river.floodStageMetres,
        // One point per 30 minutes is plenty for a sparkline.
        history: history.filter((_, i) => i % 6 === 0 || i === history.length - 1),
      },
    };
  });
}
