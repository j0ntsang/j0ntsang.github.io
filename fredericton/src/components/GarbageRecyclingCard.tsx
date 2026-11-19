import { CardFrame } from "@/components/Card";
import { CollectionPicker } from "@/components/CollectionPicker";
import { todayInCity } from "@/lib/format";
import { COLLECTION_LOCATION_KEY, readPreference } from "@/lib/preferences";
import { sourceById } from "@/sources/registry";

/** Your street's next pickups, from the bundled City zones and recycling calendar. Same card on every page. */
export function GarbageRecyclingCard({ level = 3 }: { level?: 2 | 3 }) {
  return (
    <CardFrame title="Garbage & Recycling" source={sourceById["collection-zones"]} level={level}>
      <CollectionPicker initialLocationId={readPreference(COLLECTION_LOCATION_KEY)} today={todayInCity()} />
    </CardFrame>
  );
}
