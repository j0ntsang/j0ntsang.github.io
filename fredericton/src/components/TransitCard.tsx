import { useEffect, useMemo, useState } from "react";
import { ComboBox, Input, Label, ListBox, ListBoxItem, Popover, Text, useFilter, type Key } from "react-aria-components";
import { Card } from "@/components/Card";
import type { Envelope } from "@/lib/envelope";
import { formatDay, formatMinute, minuteInCity, todayInCity } from "@/lib/format";
import { nextDepartures, type Timetable } from "@/lib/gtfs";
import { readPreference, TRANSIT_STOP_KEY, writePreference } from "@/lib/preferences";
import { sourceById } from "@/sources/registry";
import { SavedNote } from "./SavedNote";

const REFRESH_MS = 30_000;

export function TransitCard({ envelope }: { envelope: Envelope<Timetable> | null }) {
  return (
    <Card title="Next Bus" source={sourceById["fredericton-transit"]} envelope={envelope}>
      {(tt) => <StopDepartures timetable={tt} />}
    </Card>
  );
}

/** The clock, advancing every half minute so "in 4 min" stays true. */
function useCityNow() {
  const [now, setNow] = useState(() => ({ date: todayInCity(), minute: minuteInCity() }));
  useEffect(() => {
    const id = setInterval(() => setNow({ date: todayInCity(), minute: minuteInCity() }), REFRESH_MS);
    return () => clearInterval(id);
  }, []);
  return now;
}

function StopDepartures({ timetable }: { timetable: Timetable }) {
  const stops = useMemo(() => timetable.stops.map((s, index) => ({ ...s, index, label: `${s.name} (stop ${s.id})` })), [timetable]);
  const [stopId, setStopId] = useState<string | null>(() => readPreference(TRANSIT_STOP_KEY));
  const selected = stops.find((s) => s.id === stopId) ?? null;
  const [query, setQuery] = useState(selected?.label ?? "");
  const { contains } = useFilter({ sensitivity: "base" });
  const now = useCityNow();

  const results = useMemo(() => {
    const q = query.trim();
    return !q || q === selected?.label ? stops : stops.filter((s) => contains(s.label, q));
  }, [query, selected, stops, contains]);

  function choose(key: Key | null) {
    const stop = stops.find((s) => s.id === key) ?? null;
    setStopId(stop?.id ?? null);
    setQuery(stop?.label ?? "");
    writePreference(TRANSIT_STOP_KEY, stop?.id ?? null);
  }

  const expired = now.date > timetable.feedEnd;
  const departures = selected && !expired ? nextDepartures(timetable, selected.index, now.date, now.minute) : [];

  return (
    <div className="flex flex-col gap-3">
      <ComboBox
        items={results}
        selectedKey={selected?.id ?? null}
        onSelectionChange={choose}
        inputValue={query}
        onInputChange={setQuery}
        menuTrigger="focus"
        allowsEmptyCollection
        className="flex max-w-md flex-col gap-1.5"
      >
        <Label className="text-sm text-muted">Your stop</Label>
        <div className="flex rounded-md border border-line bg-surface focus-within:ring-2 focus-within:ring-accent">
          <Input
            placeholder="Street name or stop number"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>
        <Popover className="w-(--trigger-width) rounded-lg border border-line bg-surface shadow-lg">
          <ListBox<(typeof stops)[number]>
            className="max-h-72 overflow-auto p-1 outline-none"
            renderEmptyState={() => <p className="px-3 py-2 text-sm text-muted">No stop matches.</p>}
          >
            {(s) => (
              <ListBoxItem
                id={s.id}
                textValue={s.label}
                className="cursor-default rounded-md px-3 py-1.5 text-sm outline-none focus:bg-surface-2 selected:bg-accent selected:text-on-accent"
              >
                {s.label}
              </ListBoxItem>
            )}
          </ListBox>
        </Popover>
        <Text slot="description" className="text-xs text-muted">
          Scheduled times, not live tracking.
        </Text>
      </ComboBox>

      {selected ? (
        <SavedNote>{selected.name} is saved on this device. Pick another stop to change it.</SavedNote>
      ) : (
        <SavedNote>Pick a stop and we&rsquo;ll remember it on this device.</SavedNote>
      )}

      {expired ? (
        <p className="text-sm text-stale">Our copy of the timetable ended {formatDay(timetable.feedEnd)}. It refreshes when Fredericton Transit publishes the next one.</p>
      ) : !selected ? null : departures.length === 0 ? (
        <p className="text-sm text-muted">No more buses from this stop today.</p>
      ) : (
        <ol aria-label={`Next buses from ${selected.name}`} className="flex flex-col divide-y divide-line">
          {departures.map((d) => (
            <li key={`${d.route}-${d.minute}`} className="flex items-baseline justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="mr-2 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-on-accent">{d.route}</span>
                <span className="text-ink">{d.headsign}</span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="block font-medium text-ink">{d.minutesAway < 1 ? "Now" : d.minutesAway < 60 ? `${d.minutesAway} min` : formatMinute(d.minute)}</span>
                {d.minutesAway < 60 && <span className="block text-xs text-muted">{formatMinute(d.minute)}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
