import { useEffect, useState } from "react";
import { loaders, type LoadedEnvelope, type LoaderId } from ".";
import { sourceById } from "./registry";

type Cached = { at: number; promise: Promise<LoadedEnvelope<LoaderId>> };
const cache = new Map<LoaderId, Cached>();

/**
 * The browser's stand-in for the server cache: each source is fetched at most once per its
 * `revalidate` window, and every card and page on screen shares that one request.
 * A failure isn't cached, so the next caller tries again.
 */
export function loadSource<K extends LoaderId>(id: K): Promise<LoadedEnvelope<K>> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < sourceById[id].revalidate * 1000) return hit.promise as Promise<LoadedEnvelope<K>>;

  const promise = loaders[id]() as Promise<LoadedEnvelope<K>>;
  cache.set(id, { at: Date.now(), promise });
  promise.then((env) => {
    if (!env.ok && cache.get(id)?.promise === promise) cache.delete(id);
  });
  return promise;
}

/** A source's envelope, or null while it loads. Refreshes on the source's `revalidate` cadence while mounted. */
export function useSource<K extends LoaderId>(id: K): LoadedEnvelope<K> | null {
  const [envelope, setEnvelope] = useState<LoadedEnvelope<K> | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = () => loadSource(id).then((env) => mounted && setEnvelope(env));
    load();
    const timer = setInterval(load, sourceById[id].revalidate * 1000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [id]);

  return envelope;
}
