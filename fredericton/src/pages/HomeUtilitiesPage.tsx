import { FuelCard } from "@/components/cards";
import { GarbageRecyclingCard } from "@/components/GarbageRecyclingCard";
import { PageHeader, PlannedSources } from "@/components/PlannedSources";
import { sectionById } from "@/ia/sections";
import { useSource } from "@/sources/useSource";

const section = sectionById.home;

export function HomeUtilitiesPage() {
  const fuel = useSource("nbeub-fuel");

  return (
    <>
      <PageHeader title={section.title} summary={section.summary} />
      <div className="flex flex-col gap-4">
        <GarbageRecyclingCard level={2} />
        <FuelCard envelope={fuel} full />
        <PlannedSources section="home" />
      </div>
    </>
  );
}
