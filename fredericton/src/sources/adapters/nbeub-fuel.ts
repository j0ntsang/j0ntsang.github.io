import { z } from "zod";
import { collect } from "@/lib/envelope";
import { decodeEntities, stripTags } from "@/lib/html";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

const def = sourceById["nbeub-fuel"];

export type FuelPrice = { fuel: string; centsPerLitre: number };
export type Fuel = { prices: FuelPrice[]; regularSelfServe: number; dieselSelfServe: number };

const Rows = z
  .array(z.object({ fuel: z.string().min(3), centsPerLitre: z.number().positive().lt(1000) }))
  .min(8, "expected at least 8 fuel rows in the NBEUB table");

export function getFuel() {
  return collect<Fuel>(def.id, async () => {
    const res = await fetchUpstream("https://nbeub.ca/index.php?page=current-petroleum-prices-2");
    const html = await res.text();
    const table = html.match(/<table[^>]*class="maxprices"[^>]*>([\s\S]*?)<\/table>/)?.[1];
    if (!table) throw new Error("NBEUB price table (.maxprices) not found");

    const prices = Rows.parse(
      [...table.matchAll(/<tr(?![^>]*header)[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g)].map(
        ([, label, value]) => ({
          fuel: decodeEntities(stripTags(label.replace(/<br\s*\/?>/g, " "))),
          centsPerLitre: Number(stripTags(value)),
        }),
      ),
    );
    const find = (re: RegExp) => {
      const row = prices.find((p) => re.test(p.fuel));
      if (!row) throw new Error(`NBEUB row matching ${re} missing`);
      return row.centsPerLitre;
    };

    return {
      // The page publishes no effective date.
      observedAt: new Date().toISOString(),
      timeBasis: "checked",
      data: {
        prices,
        regularSelfServe: find(/^Regular Gasoline Self-serve$/),
        dieselSelfServe: find(/Diesel Self-serve$/),
      },
    };
  });
}
