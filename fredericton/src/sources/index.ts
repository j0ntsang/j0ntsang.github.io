import type { Envelope } from "@/lib/envelope";
import type { Headline } from "./adapters/cbc-nb";
import { getAqhi } from "./adapters/eccc-aqhi";
import { getCitypage } from "./adapters/eccc-citypage";
import { getRiver } from "./adapters/eccc-hydrometric";
import type { Fuel } from "./adapters/nbeub-fuel";
import { getUv } from "./adapters/open-meteo-uv";
import { getWebcams } from "./adapters/youtube-webcams";

/** Where scripts/snapshot.ts publishes the sources a browser can't fetch. */
export const snapshotUrl = (sourceId: string) => `${import.meta.env.BASE_URL}data/${sourceId}.json`;

/**
 * CBC's RSS and NBEUB's price page send no CORS headers, so the browser can't read them.
 * A scheduled job runs their adapters in Node and publishes the envelopes as JSON.
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

/** Everything that loads a connected source. The ECCC, Open-Meteo and YouTube ones run in the browser. */
export const loaders = {
  webcams: getWebcams,
  "eccc-citypage": getCitypage,
  "eccc-hydrometric": getRiver,
  "eccc-aqhi": getAqhi,
  "open-meteo-uv": getUv,
  "nbeub-fuel": () => fromSnapshot<Fuel>("nbeub-fuel"),
  "cbc-nb": () => fromSnapshot<Headline[]>("cbc-nb"),
} as const;

export type LoaderId = keyof typeof loaders;
export type LoadedEnvelope<K extends LoaderId> = Awaited<ReturnType<(typeof loaders)[K]>>;
