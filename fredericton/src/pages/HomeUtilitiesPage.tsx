import { FuelCard } from "@/components/cards";
import { CollectionPicker } from "@/components/CollectionPicker";
import { PageHeader, PlannedSources } from "@/components/PlannedSources";
import { sectionById } from "@/ia/sections";
import { todayInCity } from "@/lib/format";
import { COLLECTION_LOCATION_KEY, readPreference } from "@/lib/preferences";
import { useSource } from "@/sources/useSource";

const section = sectionById.home;

export function HomeUtilitiesPage() {
  const fuel = useSource("nbeub-fuel");

  return (
    <>
      <PageHeader title={section.title} summary={section.summary} />
      <div className="flex flex-col gap-4">
        <section aria-labelledby="collection" className="rounded-xl border border-line bg-surface p-4">
          <h2 id="collection" className="stop-heading mb-3 text-base font-semibold text-ink">
            Collection day
          </h2>
          <CollectionPicker initialLocationId={readPreference(COLLECTION_LOCATION_KEY)} today={todayInCity()} />
        </section>
        <FuelCard envelope={fuel} full />
        <PlannedSources section="home" />
      </div>
    </>
  );
}
