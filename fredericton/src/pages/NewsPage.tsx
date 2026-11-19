import { NewsTabs, type NewsStream } from "@/components/NewsTabs";
import { PageHeader } from "@/components/PlannedSources";
import { sectionById } from "@/ia/sections";
import { formatWhen } from "@/lib/format";
import { sourceById } from "@/sources/registry";
import { useSource } from "@/sources/useSource";

const section = sectionById.news;

export function NewsPage() {
  const cbc = useSource("cbc-nb");
  const streams: NewsStream[] = [
    {
      id: "cbc-nb",
      name: "CBC New Brunswick",
      items: cbc?.ok
        ? cbc.data.map((h) => ({ title: h.title, url: h.url, dateTime: h.publishedAt, when: formatWhen(h.publishedAt) }))
        : null,
      unavailableReason: !cbc ? "Loading…" : cbc.ok ? undefined : `CBC is unavailable right now (${cbc.error}).`,
    },
    { id: "city-news", name: "City of Fredericton", items: null, unavailableReason: "Not connected yet." },
    { id: "gnb-news", name: "Province", items: null, unavailableReason: sourceById["gnb-news"].note },
  ];

  return (
    <>
      <PageHeader title={section.title} summary={section.summary} />
      <div data-card className="rounded-xl border border-line bg-surface p-4" aria-busy={!cbc}>
        <NewsTabs streams={streams} />
      </div>
    </>
  );
}
