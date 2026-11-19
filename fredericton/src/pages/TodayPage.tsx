import { Link } from "react-aria-components";
import { AirCard, RiverCard, UvCard, WeatherCard } from "@/components/cards";
import { GarbageRecyclingCard } from "@/components/GarbageRecyclingCard";
import { NeedsAttention } from "@/components/NeedsAttention";
import { ThemeToggle } from "@/components/ThemeToggle";
import { city } from "@/city/fredericton";
import { sections } from "@/ia/sections";
import { formatLongDate } from "@/lib/format";
import { useSource } from "@/sources/useSource";

export function TodayPage() {
  const weather = useSource("eccc-citypage");
  const river = useSource("eccc-hydrometric");
  const aqhi = useSource("eccc-aqhi");
  const uv = useSource("open-meteo-uv");
  const closures = useSource("city-closures");
  const downCount = [weather, river, aqhi, uv, closures].filter((e) => e && !e.ok).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{formatLongDate(new Date())}</h1>
          <p className="mt-1 text-muted">What&rsquo;s happening in {city.name} right now.</p>
        </div>
        <ThemeToggle />
      </header>

      <NeedsAttention weather={weather} river={river} aqhi={aqhi} closures={closures} downCount={downCount} />

      <section aria-labelledby="conditions" className="flex flex-col gap-3">
        <h2 id="conditions" className="stop-heading text-lg font-semibold text-ink">
          Conditions
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <WeatherCard envelope={weather} />
          <RiverCard envelope={river} />
          <AirCard envelope={aqhi} />
          <UvCard envelope={uv} />
        </div>
      </section>

      <GarbageRecyclingCard level={2} />

      <nav aria-labelledby="more" className="flex flex-col gap-3">
        <h2 id="more" className="stop-heading text-lg font-semibold text-ink">
          More for {city.name}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections
            .filter((s) => s.id !== "today")
            .map((s) => (
              <li key={s.id}>
                <Link
                  href={s.href}
                  className="block h-full rounded-xl border border-line bg-surface p-4 outline-none hover:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="font-medium text-ink">{s.title}</span>
                  <span className="mt-1 block text-sm text-muted">{s.summary}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </div>
  );
}
