import { ZodError } from "zod";

/**
 * What `observedAt` means. "observed": the reading's own time. "published": when the
 * upstream published it. "checked": upstream gives no time, so it is when we last fetched.
 */
export type TimeBasis = "observed" | "published" | "checked";

export type Envelope<T> =
  | { ok: true; sourceId: string; data: T; observedAt: string; timeBasis: TimeBasis; fetchedAt: string }
  | { ok: false; sourceId: string; error: string; fetchedAt: string };

export type Freshness = "live" | "stale" | "down";

export function freshness(env: Envelope<unknown>, staleAfterMinutes: number, now = Date.now()): Freshness {
  if (!env.ok) return "down";
  const ageMinutes = (now - Date.parse(env.observedAt)) / 60_000;
  return ageMinutes > staleAfterMinutes ? "stale" : "live";
}

export async function collect<T>(
  sourceId: string,
  load: () => Promise<{ data: T; observedAt: string; timeBasis?: TimeBasis }>,
): Promise<Envelope<T>> {
  const fetchedAt = new Date().toISOString();
  try {
    const { data, observedAt, timeBasis = "observed" } = await load();
    return { ok: true, sourceId, data, observedAt, timeBasis, fetchedAt };
  } catch (err) {
    const error =
      err instanceof ZodError
        ? `Upstream shape changed: ${err.issues[0]?.path.join(".")} ${err.issues[0]?.message}`
        : err instanceof Error
          ? err.message
          : String(err);
    console.error(`[source:${sourceId}]`, error);
    return { ok: false, sourceId, error, fetchedAt };
  }
}
