import { PageHeader } from "@/components/PlannedSources";
import { SourceDetails } from "@/components/SourceDetails";
import { WebcamViewer } from "@/components/webcams/WebcamViewer";
import { STILL_REFRESH_MS } from "@/data/webcams";
import { sectionById } from "@/ia/sections";
import { sourceById } from "@/sources/registry";
import { useSource } from "@/sources/useSource";

const section = sectionById["city-watch"];

export function CityWatchPage() {
  const envelope = useSource("webcams");
  const source = sourceById.webcams;

  return (
    <>
      <PageHeader title={section.title} summary={section.summary} />

      {!envelope ? (
        <p aria-busy className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">Checking which cameras are live…</p>
      ) : envelope.ok ? (
        <WebcamViewer cams={envelope.data} initialBucket={Math.floor(Date.now() / STILL_REFRESH_MS)} />
      ) : (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">None of the cameras are live right now.</p>
      )}

      <div className="mt-6 border-t border-line pt-3">
        <SourceDetails
          name={section.title}
          owner={source.owner}
          homepage={source.homepage}
          licence={source.licence}
          cadence={source.cadence}
          error={envelope && !envelope.ok ? envelope.error : undefined}
        />
      </div>
    </>
  );
}
