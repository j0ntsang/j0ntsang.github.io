import { Link } from "react-aria-components";
import type { Envelope } from "@/lib/envelope";
import { formatWhen } from "@/lib/format";
import type { StreetClosure } from "@/sources/adapters/city-closures";
import type { Aqhi } from "@/sources/adapters/eccc-aqhi";
import type { Weather } from "@/sources/adapters/eccc-citypage";
import type { River } from "@/sources/adapters/eccc-hydrometric";

type Item = { id: string; title: string; detail?: string; href?: string; severity: "high" | "moderate" };

/** Each envelope is null while it loads. */
type Props = {
  weather: Envelope<Weather> | null;
  river: Envelope<River> | null;
  aqhi: Envelope<Aqhi> | null;
  closures: Envelope<StreetClosure[]> | null;
  downCount: number;
};

export function NeedsAttention({ weather, river, aqhi, closures, downCount }: Props) {
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

  if (closures?.ok) {
    for (const c of closures.data.filter((c) => c.status === "Closed")) {
      items.push({ id: `street-${c.street}`, title: `${c.street} is closed`, href: "/getting-around", severity: "moderate" });
    }
  }

  // Only there when something is: an all-clear box is noise on a page you check daily.
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="attention-heading" className="rounded-xl border border-line bg-surface p-4">
      <h2 id="attention-heading" className="text-base font-semibold text-ink">
        Needs attention
      </h2>
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
      <p className="mt-3 text-xs text-muted">
        Checks weather warnings, river level, air quality and City street closures. Highways, outages, boil orders and school closures are{" "}
        <Link href="/sources" className="text-accent underline-offset-2 hover:underline">
          not connected yet
        </Link>
        .{downCount > 0 && ` ${downCount} connected source${downCount > 1 ? "s are" : " is"} unavailable right now.`}
      </p>
    </section>
  );
}
