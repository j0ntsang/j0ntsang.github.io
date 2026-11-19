import { z } from "zod";
import { collect } from "@/lib/envelope";
import { queryCityLayer } from "@/lib/arcgis";
import { decodeEntities, stripTags } from "@/lib/html";
import { sourceById } from "@/sources/registry";

const def = sourceById["city-construction"];

const text = z
  .string()
  .nullable()
  .transform((s) => (s ? decodeEntities(stripTags(s.replace(/<\/li>/g, " "))) : null));

const Row = z.object({
  PRJ_NAME: z.string().min(1),
  PRJ_YEAR: z.number(),
  CP_TYPE: z.string().nullable(),
  TRFC_IMPT: text,
  PBTR_IMPT: text,
  STRT_DATE: z.number().nullable(),
  END_DATE: z.number().nullable(),
});

export type ConstructionProject = {
  name: string;
  kind: string | null;
  traffic: string | null;
  transit: string | null;
  start: string | null;
  end: string | null;
};

/** This year's City construction projects, with what each one does to traffic and transit. */
export function getConstruction(year = new Date().getFullYear()) {
  return collect<ConstructionProject[]>(def.id, async () => {
    const rows = await queryCityLayer("The_City_of_Fredericton_Construction_Projects", {
      where: `PRJ_TYPE = 'Construction Projects' AND PRJ_YEAR >= ${year}`,
      outFields: "PRJ_NAME,PRJ_YEAR,CP_TYPE,TRFC_IMPT,PBTR_IMPT,STRT_DATE,END_DATE",
      orderByFields: "PRJ_NAME",
    });
    const iso = (ms: number | null) => (ms ? new Date(ms).toISOString() : null);
    const projects = z.array(Row).parse(rows).map((r) => ({
      name: r.PRJ_NAME,
      kind: r.CP_TYPE,
      traffic: r.TRFC_IMPT,
      transit: r.PBTR_IMPT,
      start: iso(r.STRT_DATE),
      end: iso(r.END_DATE),
    }));
    return { observedAt: new Date().toISOString(), timeBasis: "checked", data: projects };
  });
}
