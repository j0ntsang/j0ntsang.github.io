import { PageHeader, PlannedSources } from "@/components/PlannedSources";
import { sectionById, type SectionId } from "@/ia/sections";

export function SectionStub({ id }: { id: SectionId }) {
  const section = sectionById[id];
  return (
    <>
      <PageHeader title={section.title} summary={section.summary} />
      <PlannedSources section={id} />
    </>
  );
}
