import { unzipSync, strFromU8 } from "fflate";
import { collect } from "@/lib/envelope";
import { buildTimetable, type Timetable } from "@/lib/gtfs";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

const def = sourceById["fredericton-transit"];

/** Fredericton Transit's official static GTFS feed (Consat/Tmix), republished nightly. No CORS, so: snapshot only. */
export const GTFS_URL = "https://fredericton.tmix.se/Tmix.Cap.TdExport.WebApi/gtfs/gtfs.zip";

export function getTransit() {
  return collect<Timetable>(def.id, async () => {
    const res = await fetchUpstream(GTFS_URL);
    const zip = unzipSync(new Uint8Array(await res.arrayBuffer()), { filter: (f) => f.name.endsWith(".txt") && f.name !== "shapes.txt" });
    const files = Object.fromEntries(Object.entries(zip).map(([name, bytes]) => [name.split("/").pop()!, strFromU8(bytes)]));
    const published = res.headers.get("last-modified");
    return {
      observedAt: published ? new Date(published).toISOString() : new Date().toISOString(),
      timeBasis: published ? "published" : "checked",
      data: buildTimetable(files),
    };
  });
}
