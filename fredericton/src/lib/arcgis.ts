import { fetchUpstream } from "./upstream";

/** The City of Fredericton's ArcGIS Online organisation. Its public views send CORS headers. */
export const CITY_ARCGIS = "https://services2.arcgis.com/iLWAxhpxafhOza2U/arcgis/rest/services";

/**
 * Attribute rows from layer 0 of a City feature service. ArcGIS reports query errors as
 * HTTP 200 with an `error` body, so those are thrown here like any other failure.
 */
export async function queryCityLayer(service: string, params: Record<string, string>): Promise<unknown[]> {
  const query = new URLSearchParams({ returnGeometry: "false", f: "json", ...params });
  const json = await (await fetchUpstream(`${CITY_ARCGIS}/${service}/FeatureServer/0/query?${query}`)).json();
  if (json?.error) throw new Error(`ArcGIS ${service}: ${json.error.message ?? json.error.code}`);
  if (!Array.isArray(json?.features)) throw new Error(`ArcGIS ${service}: no features in the response`);
  return json.features.map((f: { attributes?: unknown }) => f.attributes);
}
