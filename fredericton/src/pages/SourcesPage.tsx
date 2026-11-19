import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PlannedSources";
import { SourcesTable, type SourceRow } from "@/components/SourcesTable";
import { sectionById } from "@/ia/sections";
import { freshness, type Envelope, type Freshness } from "@/lib/envelope";
import { loaders, type LoaderId } from "@/sources";
import { sourceById, sources } from "@/sources/registry";
import { loadSource } from "@/sources/useSource";

const LIVE_LABEL: Record<Freshness, SourceRow["status"]> = { live: "Current", stale: "Out of date", down: "Unavailable" };
/** Only connected sources are checked; one that's waiting on a key would only ever say "Unavailable". */
const loaderIds = (Object.keys(loaders) as LoaderId[]).filter((id) => sourceById[id].state === "connected");
const isLoaded = (id: string): id is LoaderId => (loaderIds as string[]).includes(id);

export function SourcesPage() {
  const [envelopes, setEnvelopes] = useState<Map<string, Envelope<unknown>>>(new Map());

  useEffect(() => {
    let mounted = true;
    for (const id of loaderIds) {
      loadSource(id).then((env) => mounted && setEnvelopes((prev) => new Map(prev).set(id, env)));
    }
    return () => {
      mounted = false;
    };
  }, []);

  const rows: SourceRow[] = sources.map((s) => {
    const env = envelopes.get(s.id);
    const status: SourceRow["status"] = env
      ? LIVE_LABEL[freshness(env, s.staleAfter)]
      : isLoaded(s.id)
        ? "Checking"
        : s.state === "blocked"
          ? "Blocked"
          : s.state === "bundled"
            ? "Bundled"
            : "Planned";
    return {
      id: s.id,
      name: s.name,
      section: sectionById[s.section].title,
      owner: s.owner,
      homepage: s.homepage,
      cadence: s.cadence,
      licence: s.licence,
      status,
      note: env && !env.ok ? env.error : "note" in s ? s.note : undefined,
    };
  });

  const connected = rows.filter((r) => !["Planned", "Blocked"].includes(r.status)).length;

  return (
    <>
      <PageHeader
        title="Sources and status"
        summary={`${connected} of ${rows.length} sources connected. Status is checked when this page loads.`}
      />
      <SourcesTable rows={rows} />
    </>
  );
}
