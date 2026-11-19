import { z } from "zod";
import { collect } from "@/lib/envelope";
import { decodeEntities, stripTags } from "@/lib/html";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

const def = sourceById["cbc-nb"];

export type Headline = { title: string; url: string; publishedAt: string };

const Items = z
  .array(z.object({ title: z.string().min(1), url: z.string().url(), publishedAt: z.string().datetime() }))
  .min(1, "RSS had no items");

const tag = (xml: string, name: string) =>
  decodeEntities(stripTags(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? ""));

export function getCbcNb() {
  return collect<Headline[]>(def.id, async () => {
    const xml = await (await fetchUpstream("https://www.cbc.ca/webfeed/rss/rss-canada-newbrunswick")).text();
    const headlines = Items.parse(
      [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
        title: tag(item, "title"),
        url: tag(item, "link"),
        publishedAt: new Date(tag(item, "pubDate")).toISOString(),
      })),
    ).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    return { observedAt: headlines[0].publishedAt, timeBasis: "published", data: headlines.slice(0, 12) };
  });
}
