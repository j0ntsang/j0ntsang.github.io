import { z } from "zod";
import { city } from "@/city/fredericton";
import { collect } from "@/lib/envelope";
import { fetchUpstream } from "@/lib/upstream";
import { sourceById } from "@/sources/registry";

const def = sourceById["eccc-citypage"];

const en = <T extends z.ZodTypeAny>(t: T) => z.object({ en: t });
const measured = z.object({ value: en(z.number()) });

const Citypage = z.object({
  features: z
    .array(
      z.object({
        properties: z.object({
          lastUpdated: z.string(),
          url: en(z.string().url()),
          currentConditions: z.object({
            timestamp: en(z.string()),
            condition: en(z.string()).optional(),
            temperature: measured,
            windChill: measured.optional(),
            humidex: measured.optional(),
            relativeHumidity: measured.optional(),
            wind: z
              .object({ speed: measured, gust: measured.optional(), direction: z.object({ value: en(z.string()) }).optional() })
              .optional(),
            station: z.object({ value: en(z.string()) }),
          }),
          forecastGroup: z.object({
            forecasts: z.array(
              z.object({
                period: z.object({ textForecastName: en(z.string()) }),
                abbreviatedForecast: z.object({ textSummary: en(z.string()) }).optional(),
                textSummary: en(z.string()).optional(),
                temperatures: z.object({
                  temperature: z.array(z.object({ class: en(z.enum(["high", "low"])), value: en(z.number()) })),
                }),
              }),
            ),
          }),
          warnings: z.array(
            z.object({
              description: en(z.string()),
              type: en(z.string()),
              alertColourLevel: en(z.string()).optional(),
              eventIssue: en(z.string()).optional(),
              expiryTime: en(z.string()).optional(),
              url: en(z.string()).optional(),
            }),
          ),
          riseSet: z.object({ sunrise: en(z.string()), sunset: en(z.string()) }),
        }),
      }),
    )
    .length(1),
});

export type Warning = { title: string; kind: string; level?: string; issuedAt?: string; expiresAt?: string; url?: string };
export type ForecastPeriod = { name: string; summary: string; high?: number; low?: number };
export type Weather = {
  station: string;
  condition?: string;
  temperatureC: number;
  feelsLikeC?: number;
  humidity?: number;
  windKmh?: number;
  gustKmh?: number;
  windDirection?: string;
  sunrise: string;
  sunset: string;
  forecast: ForecastPeriod[];
  warnings: Warning[];
  detailsUrl: string;
};

export function getCitypage() {
  return collect<Weather>(def.id, async () => {
    const url = `https://api.weather.gc.ca/collections/citypageweather-realtime/items?f=json&lang=en&identifier=${city.eccc.citypageId}`;
    const json = await (await fetchUpstream(url)).json();
    const p = Citypage.parse(json).features[0].properties;
    const cc = p.currentConditions;
    const temperatureC = cc.temperature.value.en;
    // ECCC sometimes leaves a wind chill on warm observations; only meaningful at or below 0 °C.
    const feelsLikeC =
      cc.humidex?.value.en ?? (cc.windChill && temperatureC <= 0 ? cc.windChill.value.en : undefined);

    return {
      observedAt: cc.timestamp.en,
      data: {
        station: cc.station.value.en,
        condition: cc.condition?.en,
        temperatureC,
        feelsLikeC,
        humidity: cc.relativeHumidity?.value.en,
        windKmh: cc.wind?.speed.value.en,
        gustKmh: cc.wind?.gust?.value.en,
        windDirection: cc.wind?.direction?.value.en,
        sunrise: p.riseSet.sunrise.en,
        sunset: p.riseSet.sunset.en,
        detailsUrl: p.url.en,
        forecast: p.forecastGroup.forecasts.slice(0, 6).map((f) => ({
          name: f.period.textForecastName.en,
          summary: f.abbreviatedForecast?.textSummary.en ?? f.textSummary?.en ?? "",
          high: f.temperatures.temperature.find((t) => t.class.en === "high")?.value.en,
          low: f.temperatures.temperature.find((t) => t.class.en === "low")?.value.en,
        })),
        warnings: p.warnings.map((w) => ({
          title: w.description.en,
          kind: w.type.en,
          level: w.alertColourLevel?.en,
          issuedAt: w.eventIssue?.en,
          expiresAt: w.expiryTime?.en,
          url: w.url?.en,
        })),
      },
    };
  });
}
