import { useMemo, useState } from "react";
import {
  Button,
  ButtonContext,
  ComboBox,
  Input,
  Label,
  Link,
  ListBox,
  ListBoxItem,
  ListLayout,
  Popover,
  Text,
  useFilter,
  Virtualizer,
  type Key,
} from "react-aria-components";
import {
  CALENDAR,
  DAY_MS,
  locationById,
  locations,
  schedule,
  zoneById,
  type CollectionLocation,
  type Pickup,
  type Zone,
} from "@/lib/collection";
import { COLLECTION_LOCATION_KEY, writePreference } from "@/lib/preferences";
import { SavedNote } from "./SavedNote";

/** Fixed row height lets the virtualizer position rows without measuring them. */
const ROW_HEIGHT = 52;
const KIND_LABEL = { street: "Street", neighbourhood: "Neighbourhood", rural: "Rural road" } as const;

const longDate = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const formatIsoDate = (iso: string, f = longDate) => f.format(new Date(`${iso}T00:00:00Z`));

function todayOrTomorrowLabel(iso: string, today: string): string | null {
  const days = Math.round((Date.parse(iso) - Date.parse(today)) / DAY_MS);
  return days === 0 ? "Today" : days === 1 ? "Tomorrow" : null;
}

const dayList = (l: CollectionLocation) =>
  l.zoneIds
    .map((id) => zoneById(id))
    .map((z) => (z?.garbageDay ?? z?.recycling.day ?? "").slice(0, 3))
    .join(" or ");

export function CollectionPicker({ initialLocationId, today }: { initialLocationId: string | null; today: string }) {
  const initial = locationById(initialLocationId ?? undefined);
  const [selected, setSelected] = useState<CollectionLocation | null>(initial);
  const [query, setQuery] = useState(initial?.name ?? "");
  const { contains, startsWith } = useFilter({ sensitivity: "base" });

  const results = useMemo(() => {
    const q = query.trim();
    if (!q || q === selected?.name) return locations;
    const prefix = locations.filter((l) => startsWith(l.name, q));
    const rest = locations.filter((l) => !startsWith(l.name, q) && contains(l.name, q));
    return [...prefix, ...rest];
  }, [query, selected, contains, startsWith]);

  function selectLocation(key: Key | null) {
    const loc = locationById(key ? String(key) : undefined);
    setSelected(loc);
    setQuery(loc?.name ?? "");
    writePreference(COLLECTION_LOCATION_KEY, loc?.id ?? null);
  }

  return (
    <div className="flex flex-col gap-4">
      <ComboBox
        items={results}
        selectedKey={selected?.id ?? null}
        onSelectionChange={selectLocation}
        inputValue={query}
        onInputChange={setQuery}
        menuTrigger="focus"
        allowsEmptyCollection
        className="flex max-w-md flex-col gap-1.5"
      >
        <Label className="text-sm text-muted">Your street or neighbourhood</Label>
        <div className="flex rounded-md border border-line bg-surface focus-within:ring-2 focus-within:ring-accent">
          <Input
            placeholder="Start typing, e.g. Regent Street"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-muted"
          />
          {query && (
            // Opt out of ComboBox's ButtonContext, which would otherwise make Clear a second popover trigger.
            <ButtonContext.Provider value={null}>
              <Button
                aria-label="Clear"
                onPress={() => selectLocation(null)}
                className="px-2 text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg aria-hidden viewBox="0 0 12 12" className="size-3">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </Button>
            </ButtonContext.Provider>
          )}
          <Button className="px-2 text-muted outline-none hover:text-ink">
            <svg aria-hidden viewBox="0 0 12 12" className="size-3">
              <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Button>
        </div>
        <Popover className="w-(--trigger-width) rounded-lg border border-line bg-surface shadow-lg">
          <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: ROW_HEIGHT, padding: 4 }}>
            <ListBox<CollectionLocation>
              className="max-h-80 overflow-auto outline-none"
            renderEmptyState={() => (
              <p className="px-3 py-2 text-sm text-muted">
                No match. The City&rsquo;s map may not list it; call Service Fredericton at {CALENDAR.serviceFredericton}.
              </p>
            )}
          >
              {(l) => (
                <ListBoxItem
                  id={l.id}
                  textValue={l.name}
                  className="mx-1 flex h-full cursor-default flex-col justify-center rounded-md px-3 outline-none focus:bg-surface-2 selected:bg-accent selected:text-on-accent"
                >
                  <Text slot="label" className="truncate text-sm font-medium">
                    {l.name}
                  </Text>
                  <Text slot="description" className="truncate text-xs opacity-80">
                    {KIND_LABEL[l.kind]} · {dayList(l)}
                  </Text>
                </ListBoxItem>
              )}
            </ListBox>
          </Virtualizer>
        </Popover>
        <Text slot="description" className="text-xs text-muted">
          {locations.length} streets and neighbourhoods from the City&rsquo;s map.
        </Text>
      </ComboBox>

      {selected ? (
        <>
          <SavedNote>{selected.name} is saved on this device. Clear forgets it.</SavedNote>
          <LocationSchedule location={selected} today={today} />
        </>
      ) : (
        <SavedNote>Pick it once and we&rsquo;ll remember it on this device.</SavedNote>
      )}
    </div>
  );
}

function LocationSchedule({ location, today }: { location: CollectionLocation; today: string }) {
  const zones = location.zoneIds.map((id) => zoneById(id)).filter((z): z is Zone => z !== null);
  if (zones.length === 1) return <ZoneSchedule zone={zones[0]} today={today} />;

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border-l-4 border-stale bg-surface-2 p-3 text-sm text-ink">
        {location.name} crosses a zone boundary, so your day depends on which part you live on.{" "}
        <Link href={CALENDAR.cityMapUrl} target="_blank" className="text-accent underline underline-offset-2">
          Check your address on the City&rsquo;s map
        </Link>
        .
      </p>
      {zones.map((z) => (
        <section key={z.id} aria-label={z.name} className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-ink">If you&rsquo;re in the {z.garbageDay} part</h4>
          <ZoneSchedule zone={z} today={today} compact />
        </section>
      ))}
    </div>
  );
}

function ZoneSchedule({ zone, today, compact = false }: { zone: Zone; today: string; compact?: boolean }) {
  const s = schedule(zone, today);

  if (s.expired) {
    return (
      <p className="text-sm text-stale">
        Our copy of the recycling calendar ended {formatIsoDate(CALENDAR.validThrough)}.{" "}
        <Link href={CALENDAR.calendarUrl} target="_blank" className="text-accent underline-offset-2 hover:underline">
          See the current calendar
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-3 sm:grid-cols-2">
        {zone.garbageDay ? (
          <PickupRow label={`Garbage, every ${zone.garbageDay}`} pickup={s.nextGarbage} today={today} />
        ) : (
          <div className="rounded-lg bg-surface-2 p-3">
            <dt className="text-sm text-muted">Garbage</dt>
            <dd className="mt-0.5 text-sm text-ink">
              The City&rsquo;s map doesn&rsquo;t cover this road. Call Service Fredericton at{" "}
              <a href={`tel:+1${CALENDAR.serviceFredericton.replaceAll("-", "")}`} className="text-accent underline-offset-2 hover:underline">
                {CALENDAR.serviceFredericton}
              </a>
              .
            </dd>
          </div>
        )}
        <PickupRow
          label={zone.recycling.kind === "alternating" ? `Recycling, ${zone.recycling.day}s` : `Recycling, every other ${zone.recycling.day}`}
          pickup={s.nextRecycling}
          today={today}
        />
      </dl>

      {!compact && <p className="text-xs text-muted">Put everything at the curb by {CALENDAR.curbTime}.</p>}

      {s.upcomingRecycling.length > 1 && (
        <div>
          <h5 className="text-sm font-medium text-ink">Coming up</h5>
          {/* Drawn as a stretch of trail: each pickup is a stop on the green line. */}
          <ol className="mt-2 flex overflow-x-auto pb-1 text-sm text-muted">
            {s.upcomingRecycling.slice(1).map((p, i, all) => (
              <li key={p.date} className="relative flex min-w-28 shrink-0 flex-col items-center gap-1 px-2 text-center">
                <span
                  aria-hidden
                  className={`absolute top-[5px] h-[3px] bg-route ${i === 0 ? "left-1/2" : "left-0"} ${i === all.length - 1 ? "right-1/2" : "right-0"}`}
                />
                <span aria-hidden className="relative size-3.5 rounded-full border-[3px] border-live bg-surface dark:border-here dark:shadow-[0_0_8px_var(--here)]" />
                <time dateTime={p.date} className="text-ink">
                  {formatIsoDate(p.date, shortDate)}
                </time>
                {p.bin && (
                  <span>
                    <BinSwatch bin={p.bin} /> {p.bin}
                  </span>
                )}
                {p.movedFrom && <span className="text-xs text-stale">Holiday move</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function PickupRow({ label, pickup, today }: { label: string; pickup: Pickup | null; today: string }) {
  if (!pickup) return null;
  const rel = todayOrTomorrowLabel(pickup.date, today);
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5">
        <span className="text-lg font-semibold text-ink">
          {rel && <span className="mr-1.5 rounded bg-here px-1.5 py-0.5 align-middle text-xs font-semibold text-on-accent">{rel}</span>}
          <time dateTime={pickup.date}>{formatIsoDate(pickup.date)}</time>
        </span>
        {pickup.kind === "recycling" && (
          <span className="block text-sm text-ink">
            {pickup.bin ? (
              <>
                <BinSwatch bin={pickup.bin} /> {pickup.bin} bin
              </>
            ) : (
              "Recycling (every other week)"
            )}
          </span>
        )}
        {pickup.movedFrom && <span className="block text-xs text-stale">Moved from {formatIsoDate(pickup.movedFrom)} for the holiday.</span>}
        {pickup.note && <span className="block text-xs text-stale">{pickup.note}</span>}
      </dd>
    </div>
  );
}

function BinSwatch({ bin }: { bin: "Blue" | "Grey" }) {
  return <span aria-hidden className={`inline-block size-2.5 rounded-sm align-middle ${bin === "Blue" ? "bg-[#1f5fa8]" : "bg-[#8a8f94]"}`} />;
}
