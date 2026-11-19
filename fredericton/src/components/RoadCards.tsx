import { Button, Disclosure, DisclosurePanel, Heading } from "react-aria-components";
import { Card } from "@/components/Card";
import { ScrollArea } from "@/components/ScrollArea";
import type { Envelope } from "@/lib/envelope";
import { formatDate, formatDay, formatWhen } from "@/lib/format";
import type { StreetClosure } from "@/sources/adapters/city-closures";
import type { ConstructionProject } from "@/sources/adapters/city-construction";
import { isClear, type Highways } from "@/sources/adapters/nb511";
import { sourceById } from "@/sources/registry";

const STATUS = {
  Closed: { label: "Closed", item: "border-down", pill: "bg-down/15 text-down" },
  Caution: { label: "Use caution", item: "border-stale", pill: "bg-stale/15 text-stale" },
} as const;

export function ClosuresCard({ envelope }: { envelope: Envelope<StreetClosure[]> | null }) {
  return (
    <Card title="Street closures" source={sourceById["city-closures"]} envelope={envelope}>
      {(list) =>
        list.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-ink">
            <span aria-hidden className="size-2.5 rounded-full bg-live" />
            The City&rsquo;s map shows every street open.
          </p>
        ) : (
          <ScrollArea label="Street closures list">
            <ul className="flex flex-col gap-3">
              {list.map((c) => (
                <li key={c.street} className={`rounded-lg border-l-4 bg-surface-2 p-3 ${STATUS[c.status].item}`}>
                  <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS[c.status].pill}`}>
                    {STATUS[c.status].label}
                  </span>
                  <p className="mt-1.5 text-lg font-semibold text-ink">{c.street}</p>
                  {c.since && <p className="text-xs text-muted">Since {formatDate(c.since)}</p>}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )
      }
    </Card>
  );
}

export function ConstructionCard({ envelope }: { envelope: Envelope<ConstructionProject[]> | null }) {
  return (
    <Card title="Construction this year" source={sourceById["city-construction"]} envelope={envelope}>
      {(projects) =>
        projects.length === 0 ? (
          <p className="text-sm text-muted">No City construction projects listed for this year.</p>
        ) : (
          <ScrollArea label="Construction projects list">
            <ul className="flex flex-col divide-y divide-line">
              {projects.map((p) => (
                <li key={p.name} className="py-2">
                  <Disclosure className="group">
                    <Heading className="m-0">
                      <Button
                        slot="trigger"
                        className="flex w-full items-start gap-2 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <svg aria-hidden viewBox="0 0 12 12" className="mt-1.5 size-3 shrink-0 text-muted transition-transform group-data-[expanded]:rotate-90">
                          <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <span>
                          <span className="block font-medium text-ink">{p.name}</span>
                          <span className="block text-xs text-muted">
                            {p.kind ?? "Construction"}
                            {p.end && <> · until {formatDay(p.end)}</>}
                          </span>
                        </span>
                      </Button>
                    </Heading>
                    <DisclosurePanel>
                      <dl className="mt-2 ml-5 grid gap-1 text-sm">
                        {p.traffic && (
                          <>
                            <dt className="text-muted">Traffic</dt>
                            <dd className="text-ink">{p.traffic}</dd>
                          </>
                        )}
                        {p.transit && (
                          <>
                            <dt className="text-muted">Transit</dt>
                            <dd className="text-ink">{p.transit}</dd>
                          </>
                        )}
                        {!p.traffic && !p.transit && <dd className="text-muted">The City lists no traffic impact.</dd>}
                      </dl>
                    </DisclosurePanel>
                  </Disclosure>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )
      }
    </Card>
  );
}

export function HighwayCard({ envelope }: { envelope: Envelope<Highways> | null }) {
  return (
    <Card title="Highways near Fredericton" source={sourceById.nb511} envelope={envelope}>
      {({ events, conditions }) => (
        <div className="flex flex-col gap-4">
          {events.length === 0 ? (
            <p className="text-sm text-muted">No closures, incidents or roadwork reported within 50 km.</p>
          ) : (
            <ScrollArea label="Highway events list">
              <ul className="flex flex-col gap-2">
                {events.map((e) => (
                  <li key={e.id} className={`rounded-lg border-l-4 bg-surface-2 p-3 ${e.fullClosure ? "border-down" : "border-stale"}`}>
                    <p className="font-medium text-ink">
                      {e.fullClosure && "Closed: "}
                      {[e.road, e.direction].filter(Boolean).join(" ") || e.kind || "Incident"}
                    </p>
                    {e.description && <p className="text-sm text-ink">{e.description}</p>}
                    <p className="text-xs text-muted">
                      {[e.kind, e.lanes, e.end && `until ${formatWhen(e.end)}`, e.updated && `updated ${formatWhen(e.updated)}`].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
          {conditions.length > 0 && <RoadConditions conditions={conditions} />}
        </div>
      )}
    </Card>
  );
}

function RoadConditions({ conditions }: { conditions: Highways["conditions"] }) {
  const notClear = conditions.filter((c) => !isClear(c));
  const clear = conditions.length - notClear.length;
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink">Road conditions</h4>
      {notClear.length > 0 && (
        <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
          {notClear.map((c, i) => (
            <li key={`${c.road}-${c.where}-${i}`}>
              <span className="text-ink">{[c.road, c.where].filter(Boolean).join(", ") || "Unnamed section"}</span>
              <span className="text-muted">: {c.condition}</span>
            </li>
          ))}
        </ul>
      )}
      {clear > 0 && (
        <p className="mt-1 text-sm text-muted">
          {notClear.length === 0 ? `All ${clear} sections` : `${clear} other section${clear > 1 ? "s" : ""}`} within 50 km {clear > 1 ? "are" : "is"} bare and dry.
        </p>
      )}
    </div>
  );
}
