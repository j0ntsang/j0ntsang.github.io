import { Link } from "react-aria-components";
import type { SectionId } from "@/ia/sections";
import { sourcesInSection } from "@/sources/registry";

export function PlannedSources({ section }: { section: SectionId }) {
  const pending = sourcesInSection(section).filter((s) => s.state === "planned" || s.state === "blocked");
  if (pending.length === 0) return null;
  return (
    <section data-card aria-labelledby={`planned-${section}`} className="rounded-xl border border-dashed border-line p-4">
      <h2 id={`planned-${section}`} className="stop-heading text-sm font-semibold text-ink">
        Coming to this section
      </h2>
      <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2">
        {pending.map((s) => (
          <li key={s.id}>
            {s.name}
            {s.state === "blocked" && <span className="ml-1 text-xs text-stale">(blocked: {s.note})</span>}
          </li>
        ))}
      </ul>
      <Link href="/sources" className="mt-3 inline-block text-xs text-accent underline-offset-2 hover:underline">
        See every source and its status
      </Link>
    </section>
  );
}

export function PageHeader({ title, summary }: { title: string; summary: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-muted">{summary}</p>
    </header>
  );
}
