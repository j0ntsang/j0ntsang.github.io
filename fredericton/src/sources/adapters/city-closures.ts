import { z } from "zod";
import { collect } from "@/lib/envelope";
import { queryCityLayer } from "@/lib/arcgis";
import { sourceById } from "@/sources/registry";

const def = sourceById["city-closures"];

const Row = z.object({
  STREET_NAME: z.string().min(1),
  OpenedClosed: z.enum(["Closed", "Cautio"]),
  EditDate: z.number().nullable(),
});

export type StreetClosure = { street: string; status: "Closed" | "Caution"; since: string | null };

/** The City's open/closed map of every street; only the ones that aren't open are fetched. */
export function getClosures() {
  return collect<StreetClosure[]>(def.id, async () => {
    const rows = await queryCityLayer("StreetsOpenClosed2025_PublicView", {
      where: "OpenedClosed <> 'Open'",
      outFields: "STREET_NAME,OpenedClosed,EditDate",
      orderByFields: "STREET_NAME",
    });
    const closures = z.array(Row).parse(rows).map((r) => ({
      street: r.STREET_NAME,
      // The layer's coded value is truncated to six characters.
      status: r.OpenedClosed === "Closed" ? ("Closed" as const) : ("Caution" as const),
      since: r.EditDate ? new Date(r.EditDate).toISOString() : null,
    }));
    // A street is listed once per segment; one row per street is enough here.
    const byStreet = new Map<string, StreetClosure>();
    for (const c of closures) if (!byStreet.has(c.street) || c.status === "Closed") byStreet.set(c.street, c);

    // The layer has no "as of" time: this is when the City's map was read.
    return { observedAt: new Date().toISOString(), timeBasis: "checked", data: [...byStreet.values()] };
  });
}
