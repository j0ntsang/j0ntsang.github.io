import { freshness, type Envelope } from "@/lib/envelope";
import { formatAge, formatWhen } from "@/lib/format";
import type { SourceDef } from "@/sources/registry";
import { SourceDetails } from "./SourceDetails";

const BASIS_LABEL = { observed: "Observed", published: "Published", checked: "Checked" } as const;

const STATE_STYLE = {
  live: "bg-live/15 text-live",
  stale: "bg-stale/15 text-stale",
  down: "bg-down/15 text-down",
} as const;

const STATE_LABEL = { live: "Current", stale: "Out of date", down: "Unavailable" } as const;

type Props<T> = {
  title: string;
  source: SourceDef;
  /** Null while the source loads. */
  envelope: Envelope<T> | null;
  children: (data: T) => React.ReactNode;
  className?: string;
};

export function Card<T>({ title, source, envelope, children, className = "" }: Props<T>) {
  const state = envelope ? freshness(envelope, source.staleAfter) : null;
  const headingId = `card-${source.id}-${title.toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} aria-busy={!envelope} className={`flex flex-col rounded-xl border border-line bg-surface p-4 ${className}`}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <h3 id={headingId} className="text-base font-semibold text-ink">
          {title}
        </h3>
        {state && state !== "live" && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLE[state]}`}>
            {STATE_LABEL[state]}
          </span>
        )}
      </header>

      <div className="flex-1">
        {!envelope ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : envelope.ok ? (
          children(envelope.data)
        ) : (
          <p className="text-sm text-muted">
            We couldn&rsquo;t reach {source.owner} just now. Nothing below is guessed.
          </p>
        )}
      </div>

      <footer className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
        {envelope?.ok && (
          <p className="text-xs text-muted">
            {BASIS_LABEL[envelope.timeBasis]}{" "}
            <time dateTime={envelope.observedAt}>{formatWhen(envelope.observedAt)}</time>{" "}
            <span aria-hidden>·</span> {formatAge(envelope.observedAt)}
          </p>
        )}
        <SourceDetails
          name={title}
          owner={source.owner}
          homepage={source.homepage}
          licence={source.licence}
          cadence={source.cadence}
          error={envelope && !envelope.ok ? envelope.error : undefined}
        />
      </footer>
    </section>
  );
}
