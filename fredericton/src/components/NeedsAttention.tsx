import { Link } from "react-aria-components";
import type { Envelope } from "@/lib/envelope";
import { formatWhen } from "@/lib/format";
import type { Aqhi } from "@/sources/adapters/eccc-aqhi";
import type { Weather } from "@/sources/adapters/eccc-citypage";
import type { River } from "@/sources/adapters/eccc-hydrometric";

type Item = { id: string; title: string; detail?: string; href?: string; severity: "high" | "moderate" };

/** Each envelope is null while it loads. */
type Props = {
  weather: Envelope<Weather> | null;
  river: Envelope<River> | null;
  aqhi: Envelope<Aqhi> | null;
  downCount: number;
};

export function NeedsAttention({ weather, river, aqhi, downCount }: Props) {
  const items: Item[] = [];

  if (weather?.ok) {
    for (const w of weather.data.warnings) {
      items.push({
        id: `wx-${w.title}`,
        title: w.title.charAt(0) + w.title.slice(1).toLowerCase(),
        detail: w.expiresAt ? `Until ${formatWhen(w.expiresAt)}` : undefined,
        href: w.url,
        severity: w.kind === "warning" ? "high" : "moderate",
      });
    }
  }
  if (river?.ok && river.data.levelM >= river.data.floodStageM) {
    items.push({ id: "river", title: "Wolastoq is at or above flood stage", detail: `${river.data.levelM.toFixed(2)} m`, href: "/health-safety", severity: "high" });
  }
  if (aqhi?.ok && aqhi.data.risk !== "Low" && aqhi.data.risk !== "Moderate") {
    items.push({ id: "aqhi", title: `Air quality: ${aqhi.data.risk.toLowerCase()} risk`, href: "/health-safety", severity: "high" });
  }

  const cleared = [
    weather?.ok && "no weather warnings",
    river?.ok && "river below flood stage",
    aqhi?.ok && "air quality below high risk",
  ].filter(Boolean) as string[];
  const loading = !weather || !river || !aqhi;

  return (
    <section aria-labelledby="attention-heading" className="rounded-xl border border-line bg-surface p-4">
      <h2 id="attention-heading" className="text-base font-semibold text-ink">
        Needs attention
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted" aria-busy={loading}>
          {loading
            ? "Checking warnings, river level and air quality…"
            : cleared.length > 0 ? `Nothing unusual right now: ${cleared.join(", ")}.` : "We can't check anything right now."}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.id} className={`rounded-lg border-l-4 bg-surface-2 p-3 ${i.severity === "high" ? "border-down" : "border-stale"}`}>
              {i.href ? (
                <Link href={i.href} className="font-medium text-ink underline-offset-2 hover:underline">
                  {i.title}
                </Link>
              ) : (
                <p className="font-medium text-ink">{i.title}</p>
              )}
              {i.detail && <p className="text-sm text-muted">{i.detail}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        Checks weather warnings, river level and air quality. Road closures, outages, boil orders and school closures are{" "}
        <Link href="/sources" className="text-accent underline-offset-2 hover:underline">
          not connected yet
        </Link>
        .{downCount > 0 && ` ${downCount} connected source${downCount > 1 ? "s are" : " is"} unavailable right now.`}
      </p>
    </section>
  );
}
