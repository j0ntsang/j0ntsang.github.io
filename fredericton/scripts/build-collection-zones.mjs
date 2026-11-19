// Builds src/data/collection-zones.json from the City of Fredericton's ArcGIS layers:
// every street and neighbourhood, mapped to the garbage zone(s) it falls in.
// Zone geometry changes rarely (last edited 2023), so this runs on demand, not per request.
//   pnpm zones

import { writeFile } from "node:fs/promises";

const BASE = "https://services2.arcgis.com/iLWAxhpxafhOza2U/arcgis/rest/services";
const GARBAGE = `${BASE}/Garbage/FeatureServer/0`;
const NEIGHBOURHOODS = `${BASE}/Neighbourhoods/FeatureServer/0`;
const STREETS = `${BASE}/STREET_NAMES/FeatureServer/0`;

// Roads the City sends to the Capital Region recycling calendar (Circular Materials 2026–27).
// These override any same-named street from the City layer.
const RURAL_ROADS = [
  { id: "carlisle-road", name: "Carlisle Road", recyclingDay: "Tuesday" },
  { id: "pepper-creek", name: "Pepper Creek", recyclingDay: "Wednesday" },
  { id: "killarney-road", name: "Killarney Road", recyclingDay: "Thursday" },
];

// Sitansisk has its own Circular Materials calendar and isn't on City collection.
const EXCLUDED_NEIGHBOURHOODS = new Set(["Saint Mary's First Nation"]);

const SAMPLE_GRID = 20;
const SEGMENT_STEPS = 4;
/** A zone must cover at least this share of a location's sample points to be listed for it. */
const MIN_SHARE = 0.15;
const PAGE = 2000;

async function fetchAllFeatures(layer, params) {
  const features = [];
  for (let offset = 0; ; offset += PAGE) {
    const qs = new URLSearchParams({
      f: "geojson",
      outSR: "4326",
      returnGeometry: "true",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE),
      ...params,
    });
    const res = await fetch(`${layer}/query?${qs}`);
    if (!res.ok) throw new Error(`${res.status} ${layer}`);
    const json = await res.json();
    if (!json.features) throw new Error(`No features from ${layer}: ${JSON.stringify(json).slice(0, 200)}`);
    features.push(...json.features);
    if (json.features.length < PAGE) return features;
  }
}

const polygonsOf = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
const linesOf = (g) => (g?.type === "LineString" ? [g.coordinates] : g?.type === "MultiLineString" ? g.coordinates : []);

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Even-odd across all rings handles holes.
const inGeometry = (pt, g) => polygonsOf(g).some((rings) => rings.filter((r) => inRing(pt, r)).length % 2 === 1);

function polygonSamples(g) {
  const coords = polygonsOf(g).flat(2);
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pts = [];
  for (let i = 0; i < SAMPLE_GRID; i++)
    for (let j = 0; j < SAMPLE_GRID; j++) {
      const pt = [minX + ((i + 0.5) / SAMPLE_GRID) * (maxX - minX), minY + ((j + 0.5) / SAMPLE_GRID) * (maxY - minY)];
      if (inGeometry(pt, g)) pts.push(pt);
    }
  return pts;
}

// Points along each segment, so long segments outweigh short ones.
function lineSamples(g) {
  const pts = [];
  for (const line of linesOf(g))
    for (let i = 1; i < line.length; i++)
      for (let s = 0; s < SEGMENT_STEPS; s++) {
        const t = (s + 0.5) / SEGMENT_STEPS;
        pts.push([line[i - 1][0] + t * (line[i][0] - line[i - 1][0]), line[i - 1][1] + t * (line[i][1] - line[i - 1][1])]);
      }
  return pts;
}

const zoneIdOf = (rawDay) => String(rawDay).split("/")[0].trim().toLowerCase();

const garbage = await fetchAllFeatures(GARBAGE, { where: "1=1", outFields: "OBJECTID,Day" });
const zoneAt = (pt) => {
  const hit = garbage.find((f) => inGeometry(pt, f.geometry));
  return hit ? zoneIdOf(hit.properties.Day) : null;
};

const capitals = (s) => (s.match(/[A-Z]/g) ?? []).length;

/**
 * name → Map(zoneId → sample count), merged across features that share a name.
 * Names merge case-insensitively (the layer has both "Mcnair Drive" and "McNair Drive");
 * the spelling with more capitals wins.
 */
function countZoneSamplesByName(features, nameOf, samplesOf, skip = () => false) {
  const byKey = new Map();
  for (const f of features) {
    const name = nameOf(f)?.trim().replace(/\s+/g, " ");
    if (!name || skip(name) || !f.geometry) continue;
    const key = name.toLowerCase();
    const entry = byKey.get(key) ?? { name, counts: new Map() };
    if (capitals(name) > capitals(entry.name)) entry.name = name;
    for (const pt of samplesOf(f.geometry)) {
      const z = zoneAt(pt);
      if (z) entry.counts.set(z, (entry.counts.get(z) ?? 0) + 1);
    }
    byKey.set(key, entry);
  }
  return new Map([...byKey.values()].map((e) => [e.name, e.counts]));
}

const ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday"];
function zonesFor(counts) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...counts]
    .filter(([, c]) => c / total >= MIN_SHARE)
    .map(([z]) => z)
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ruralNames = new Set(RURAL_ROADS.map((r) => r.name.toLowerCase()));

const neighbourhoodCounts = countZoneSamplesByName(
  await fetchAllFeatures(NEIGHBOURHOODS, { where: "1=1", outFields: "Neighbourhood" }),
  (f) => f.properties.Neighbourhood,
  polygonSamples,
  (name) => EXCLUDED_NEIGHBOURHOODS.has(name),
);
const streetCounts = countZoneSamplesByName(
  await fetchAllFeatures(STREETS, { where: "1=1", outFields: "STREET_NAME" }),
  (f) => f.properties.STREET_NAME,
  lineSamples,
  (name) => ruralNames.has(name.toLowerCase()),
);

const locations = [];
for (const [kind, counts] of [["neighbourhood", neighbourhoodCounts], ["street", streetCounts]])
  for (const [name, c] of counts) {
    const zoneIds = zonesFor(c);
    // Outside every garbage zone means the City doesn't collect there (or the layer doesn't say).
    if (zoneIds.length) locations.push({ id: `${kind}-${slug(name)}`, name, kind, zoneIds });
  }
for (const r of RURAL_ROADS) locations.push({ id: `rural-${r.id}`, name: r.name, kind: "rural", zoneIds: [r.id] });
locations.sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));

const zones = [
  ...ORDER.map((id) => {
    const day = id.charAt(0).toUpperCase() + id.slice(1);
    return { id, name: `${day} zone`, garbageDay: day, recycling: { kind: "alternating", day } };
  }),
  // The City's street layer doesn't cover these roads, so their garbage day can't be derived.
  ...RURAL_ROADS.map((r) => ({ id: r.id, name: r.name, garbageDay: null, recycling: { kind: "week-a", day: r.recyclingDay } })),
];

const out = {
  generatedAt: new Date().toISOString(),
  source: {
    zones: `${GARBAGE} (City of Fredericton)`,
    neighbourhoods: `${NEIGHBOURHOODS} (City of Fredericton)`,
    streets: `${STREETS} (City of Fredericton)`,
    note: `Locations are mapped by sampling. One crossing a zone edge lists every zone covering ${MIN_SHARE * 100}%+ of it.`,
  },
  zones,
  locations,
};

await writeFile(new URL("../src/data/collection-zones.json", import.meta.url), JSON.stringify(out) + "\n");

const split = locations.filter((l) => l.zoneIds.length > 1);
console.log(
  `${locations.length} locations (${locations.filter((l) => l.kind === "street").length} streets, ` +
    `${locations.filter((l) => l.kind === "neighbourhood").length} neighbourhoods), ${split.length} span zones`,
);
console.log(`skipped (outside all zones): ${[...streetCounts].filter(([, c]) => !zonesFor(c).length).length} streets`);
