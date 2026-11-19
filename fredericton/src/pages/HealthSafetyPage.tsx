import { AirCard, RiverCard, UvCard, WeatherCard } from "@/components/cards";
import { PageHeader, PlannedSources } from "@/components/PlannedSources";
import { sectionById } from "@/ia/sections";
import { useSource } from "@/sources/useSource";

const section = sectionById["health-safety"];

export function HealthSafetyPage() {
  const weather = useSource("eccc-citypage");
  const river = useSource("eccc-hydrometric");
  const aqhi = useSource("eccc-aqhi");
  const uv = useSource("open-meteo-uv");

  return (
    <>
      <PageHeader title={section.title} summary={section.summary} />
      <div className="grid gap-4 lg:grid-cols-2">
        <RiverCard envelope={river} />
        <div className="flex flex-col gap-4">
          <AirCard envelope={aqhi} />
          <UvCard envelope={uv} />
        </div>
        <div className="lg:col-span-2">
          <WeatherCard envelope={weather} full />
        </div>
        <div className="lg:col-span-2">
          <PlannedSources section="health-safety" />
        </div>
      </div>
    </>
  );
}
