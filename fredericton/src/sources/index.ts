import type { Envelope } from "@/lib/envelope";
import type { Timetable } from "@/lib/gtfs";
import type { Headline } from "./adapters/cbc-nb";
import { getClosures } from "./adapters/city-closures";
import { getConstruction } from "./adapters/city-construction";
import { getAqhi } from "./adapters/eccc-aqhi";
import { getCitypage } from "./adapters/eccc-citypage";
import { getRiver } from "./adapters/eccc-hydrometric";
import type { Highways } from "./adapters/nb511";
import type { Fuel } from "./adapters/nbeub-fuel";
import { getUv } from "./adapters/open-meteo-uv";
import { getWebcams } from "./adapters/youtube-webcams";

/** Where scripts/snapshot.ts publishes the sources a browser can't fetch. */
export const snapshotUrl = (sourceId: string) => `${import.meta.env.BASE_URL}data/${sourceId}.json`;

/**
 * CBC's RSS, NBEUB's price page, the transit GTFS zip and NB 511 can't be read from the browser
 * (no CORS headers, or a secret key). A scheduled job runs their adapters in Node and publishes
 * the envelopes as JSON.
 */
async function fromSnapshot<T>(sourceId: string): Promise<Envelope<T>> {
  try {
    const res = await fetch(snapshotUrl(sourceId), { cache: "no-cache" });
    if (!res.ok) throw new Error(`no snapshot published (${res.status})`);
    return (await res.json()) as Envelope<T>;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[source:${sourceId}]`, error);
    return { ok: false, sourceId, error, fetchedAt: new Date().toISOString() };
  }
}

/** Everything that loads a source. The ECCC, Open-Meteo, City ArcGIS and YouTube ones run in the browser. */
export const loaders = {
  webcams: getWebcams,
  "eccc-citypage": getCitypage,
  "eccc-hydrometric": getRiver,
  "eccc-aqhi": getAqhi,
  "open-meteo-uv": getUv,
  "nbeub-fuel": () => fromSnapshot<Fuel>("nbeub-fuel"),
  "cbc-nb": () => fromSnapshot<Headline[]>("cbc-nb"),
  "city-closures": getClosures,
  "city-construction": () => getConstruction(),
  "fredericton-transit": () => fromSnapshot<Timetable>("fredericton-transit"),
  nb511: () => fromSnapshot<Highways>("nb511"),
} as const;

export type LoaderId = keyof typeof loaders;
export type LoadedEnvelope<K extends LoaderId> = Awaited<ReturnType<(typeof loaders)[K]>>;
