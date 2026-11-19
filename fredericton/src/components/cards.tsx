import { Card } from "@/components/Card";
import { IndexMeter } from "@/components/IndexMeter";
import { RiverSparkline } from "@/components/RiverSparkline";
import { city } from "@/city/fredericton";
import type { Envelope } from "@/lib/envelope";
import { formatTime, formatWhen, signed } from "@/lib/format";
import type { Aqhi } from "@/sources/adapters/eccc-aqhi";
import type { Weather } from "@/sources/adapters/eccc-citypage";
import type { River } from "@/sources/adapters/eccc-hydrometric";
import type { Fuel } from "@/sources/adapters/nbeub-fuel";
import type { Uv } from "@/sources/adapters/open-meteo-uv";
import { sourceById } from "@/sources/registry";

export function WeatherCard({ envelope, full = false }: { envelope: Envelope<Weather> | null; full?: boolean }) {
  return (
    <Card title="Weather" source={sourceById["eccc-citypage"]} envelope={envelope}>
      {(w) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <p className="text-5xl font-semibold tabular-nums leading-none text-ink">
              {Math.round(w.temperatureC)}
              <span className="align-top text-2xl">°C</span>
            </p>
            <div className="pb-1 text-sm text-muted">
              {w.condition && <p className="text-ink">{w.condition}</p>}
              {w.feelsLikeC !== undefined && <p>Feels like {Math.round(w.feelsLikeC)}°</p>}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {w.windKmh !== undefined && (
              <>
                <dt className="text-muted">Wind</dt>
                <dd className="text-ink">
                  {w.windDirection} {w.windKmh} km/h{w.gustKmh ? `, gusts ${w.gustKmh}` : ""}
                </dd>
              </>
            )}
            {w.humidity !== undefined && (
              <>
                <dt className="text-muted">Humidity</dt>
                <dd className="text-ink">{w.humidity}%</dd>
              </>
            )}
            <dt className="text-muted">Sunrise · sunset</dt>
            <dd className="text-ink">
              {formatTime(w.sunrise)} · {formatTime(w.sunset)}
            </dd>
          </dl>
          <ol className={`grid gap-2 text-sm ${full ? "sm:grid-cols-3" : "grid-cols-2"}`} aria-label="Forecast">
            {w.forecast.slice(0, full ? 6 : 2).map((f) => (
              <li key={f.name} className="rounded-lg bg-surface-2 p-2">
                <p className="font-medium text-ink">{f.name}</p>
                <p className="text-muted">
                  {f.summary}
                  {f.high !== undefined && `, high ${f.high}°`}
                  {f.low !== undefined && `, low ${f.low}°`}
                </p>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted">Measured at {w.station}.</p>
        </div>
      )}
    </Card>
  );
}

export function RiverCard({ envelope }: { envelope: Envelope<River> | null }) {
  return (
    <Card title={`${city.river.name} at Fredericton`} source={sourceById["eccc-hydrometric"]} envelope={envelope}>
      {(r) => {
        const pct = Math.round((r.levelM / r.floodStageM) * 100);
        const trend =
          r.change6hM === null ? null : Math.abs(r.change6hM) < 0.02 ? "Steady" : r.change6hM > 0 ? "Rising" : "Falling";
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-semibold tabular-nums text-ink">
                {r.levelM.toFixed(2)}
                <span className="text-xl"> m</span>
              </p>
              {trend && (
                <p className="text-sm text-muted">
                  {trend}, {signed(r.change6hM!)} m in 6 h
                </p>
              )}
            </div>
            <IndexMeter
              label="Share of flood stage"
              value={r.levelM}
              max={r.floodStageM}
              valueText={`${pct}% of ${r.floodStageM} m`}
              tone={pct >= 100 ? "high" : pct >= 80 ? "moderate" : "low"}
            />
            <RiverSparkline
              history={r.history}
              label={`River level over the last 48 hours, currently ${r.levelM.toFixed(2)} metres`}
            />
          </div>
        );
      }}
    </Card>
  );
}

export function AirCard({ envelope }: { envelope: Envelope<Aqhi> | null }) {
  return (
    <Card title="Air quality" source={sourceById["eccc-aqhi"]} envelope={envelope}>
      {(a) => (
        <div className="flex flex-col gap-2">
          <IndexMeter
            label="AQHI"
            value={a.value}
            max={10}
            valueText={`${Math.round(a.value)}, ${a.risk.toLowerCase()} risk`}
            tone={a.risk === "Low" ? "low" : a.risk === "Moderate" ? "moderate" : "high"}
          />
          <p className="text-sm text-muted">
            {a.risk === "Low"
              ? "Ideal for outdoor activities."
              : a.risk === "Moderate"
                ? "People at risk should consider reducing strenuous outdoor activity."
                : "Reduce or reschedule strenuous outdoor activity."}
          </p>
          {a.outlook && (
            <p className="text-sm text-muted">
              Next 24 h: up to <span className="font-medium text-ink">{a.outlook.value}</span>, {a.outlook.risk.toLowerCase()} risk
              {a.outlook.risk !== "Low" && <>, around {formatWhen(a.outlook.at)}</>}. ECCC forecast.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export function UvCard({ envelope }: { envelope: Envelope<Uv> | null }) {
  return (
    <Card title="UV index" source={sourceById["open-meteo-uv"]} envelope={envelope}>
      {(u) => {
        const tone = u.todayMax >= 6 ? "high" : u.todayMax >= 3 ? "moderate" : "low";
        return (
          <div className="flex flex-col gap-2">
            <IndexMeter label="Now" value={u.now} max={11} valueText={u.now.toFixed(1)} tone={u.now >= 6 ? "high" : u.now >= 3 ? "moderate" : "low"} />
            <IndexMeter label="Today's peak" value={u.todayMax} max={11} valueText={u.todayMax.toFixed(1)} tone={tone} />
            <p className="text-xs text-muted">Modelled forecast, not a measurement.</p>
          </div>
        );
      }}
    </Card>
  );
}

export function FuelCard({ envelope, full = false }: { envelope: Envelope<Fuel> | null; full?: boolean }) {
  return (
    <Card title="Fuel maximum prices" source={sourceById["nbeub-fuel"]} envelope={envelope}>
      {(f) =>
        full ? (
          <table className="w-full text-sm">
            <caption className="sr-only">NB regulated maximum prices, cents per litre including HST</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-2 font-semibold">Fuel</th>
                <th scope="col" className="py-2 text-right font-semibold">¢/L incl. HST</th>
              </tr>
            </thead>
            <tbody>
              {f.prices.map((p) => (
                <tr key={p.fuel} className="border-b border-line last:border-0">
                  <th scope="row" className="py-1.5 text-left font-normal text-ink">{p.fuel}</th>
                  <td className="py-1.5 text-right tabular-nums text-ink">{p.centsPerLitre.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-sm text-muted">Regular, self-serve</dt>
              <dd className="text-3xl font-semibold tabular-nums text-ink">
                {f.regularSelfServe.toFixed(1)}
                <span className="text-base font-normal text-muted"> ¢/L</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Diesel, self-serve</dt>
              <dd className="text-3xl font-semibold tabular-nums text-ink">
                {f.dieselSelfServe.toFixed(1)}
                <span className="text-base font-normal text-muted"> ¢/L</span>
              </dd>
            </div>
          </dl>
        )
      }
    </Card>
  );
}
