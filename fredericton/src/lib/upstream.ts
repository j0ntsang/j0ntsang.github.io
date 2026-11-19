// CBC's CDN resets connections for agents containing a "+https://…" contact URL.
const USER_AGENT = "Mozilla/5.0 (compatible; fredericton-today/0.1)";

/**
 * Runs in the browser (CORS-enabled sources) and in Node (scripts/snapshot.ts). Only Node
 * sends a user agent: browsers own that header, and setting one would add a CORS preflight.
 */
export async function fetchUpstream(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: typeof window === "undefined" ? { "user-agent": USER_AGENT } : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res;
}
