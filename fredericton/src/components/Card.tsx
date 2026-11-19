import type { ReactNode } from "react";
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

type FrameProps = {
  title: string;
  source: SourceDef;
  children: ReactNode;
  /** Beside the title, e.g. a freshness badge. */
  badge?: ReactNode;
  /** Above "About this data", e.g. when the data was observed. */
  meta?: ReactNode;
  error?: string;
  /** h3 inside a page section, h2 when the card stands on its own. Looks the same either way. */
  level?: 2 | 3;
  busy?: boolean;
  className?: string;
  /** Border and background; replaces the default rather than fighting it in the cascade. */
  tone?: string;
};

/** Every card's frame: title, body, and the "About this data" footer for its source. */
export function CardFrame({
  title,
  source,
  children,
  badge,
  meta,
  error,
  level = 3,
  busy = false,
  className = "",
  tone = "border border-line bg-surface",
}: FrameProps) {
  const headingId = `card-${source.id}-${title.toLowerCase().replace(/\W+/g, "-")}`;
  const Heading = level === 2 ? "h2" : "h3";

  return (
    <section data-card aria-labelledby={headingId} aria-busy={busy} className={`flex flex-col rounded-xl p-4 ${tone} ${className}`}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <Heading id={headingId} className="text-base font-semibold text-ink">
          {title}
        </Heading>
        {badge}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
        {meta}
        <SourceDetails
          name={title}
          owner={source.owner}
          homepage={source.homepage}
          licence={source.licence}
          cadence={source.cadence}
          error={error}
        />
      </footer>
    </section>
  );
}

type Props<T> = Omit<FrameProps, "children" | "badge" | "meta" | "error" | "busy"> & {
  /** Null while the source loads. */
  envelope: Envelope<T> | null;
  children: (data: T) => ReactNode;
};

/** A card for a fetched source: loading and failure states, a freshness badge, and when it was observed. */
export function Card<T>({ envelope, children, ...frame }: Props<T>) {
  const state = envelope ? freshness(envelope, frame.source.staleAfter) : null;

  return (
    <CardFrame
      {...frame}
      busy={!envelope}
      badge={
        state &&
        state !== "live" && <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLE[state]}`}>{STATE_LABEL[state]}</span>
      }
      meta={
        envelope?.ok && (
          <p className="text-xs text-muted">
            {BASIS_LABEL[envelope.timeBasis]} <time dateTime={envelope.observedAt}>{formatWhen(envelope.observedAt)}</time>{" "}
            <span aria-hidden>·</span> {formatAge(envelope.observedAt)}
          </p>
        )
      }
      error={envelope && !envelope.ok ? envelope.error : undefined}
    >
      {!envelope ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : envelope.ok ? (
        children(envelope.data)
      ) : (
        <p className="text-sm text-muted">We couldn&rsquo;t reach {frame.source.owner} just now. Nothing below is guessed.</p>
      )}
    </CardFrame>
  );
}
