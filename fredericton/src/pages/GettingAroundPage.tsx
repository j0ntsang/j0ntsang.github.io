import { PageHeader, PlannedSources } from "@/components/PlannedSources";
import { ClosuresCard, ConstructionCard, HighwayCard } from "@/components/RoadCards";
import { TransitCard } from "@/components/TransitCard";
import { sectionById } from "@/ia/sections";
import { sourceById } from "@/sources/registry";
import { useSource } from "@/sources/useSource";

const section = sectionById["getting-around"];

export function GettingAroundPage() {
  const closures = useSource("city-closures");
  const construction = useSource("city-construction");
  const transit = useSource("fredericton-transit");

  return (
    <>
      <PageHeader title={section.title} summary={section.summary} />
      <div className="flex flex-col gap-4">
        <TransitCard envelope={transit} />
        {/* Side by side on desktop, stacked on mobile; long lists scroll inside their cards. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ClosuresCard envelope={closures} />
          <ConstructionCard envelope={construction} />
        </div>
        {sourceById.nb511.state === "connected" && <Highways />}
        <PlannedSources section="getting-around" />
      </div>
    </>
  );
}


/** Its own component so the 511 snapshot is only requested once that source is switched on. */
function Highways() {
  return <HighwayCard envelope={useSource("nb511")} />;
}
