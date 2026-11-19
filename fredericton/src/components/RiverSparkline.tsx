import type { RiverReading } from "@/sources/adapters/eccc-hydrometric";

const W = 320;
const H = 64;
const PAD = 2;
const MIN_SPAN_M = 1;

export function RiverSparkline({ history, label }: { history: RiverReading[]; label: string }) {
  if (history.length < 2) return null;
  const levels = history.map((r) => r.levelM);
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  // Auto-scaling makes a few centimetres look like a surge. Never zoom in past MIN_SPAN.
  const span = Math.max(max - min, MIN_SPAN_M);
  const floor = (min + max) / 2 - span / 2;
  const t0 = Date.parse(history[0].at);
  const tSpan = Date.parse(history[history.length - 1].at) - t0 || 1;

  const points = history
    .map((r) => {
      const x = PAD + ((Date.parse(r.at) - t0) / tSpan) * (W - PAD * 2);
      const y = PAD + (1 - (r.levelM - floor) / span) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full text-accent" role="img" aria-label={label} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted">
        <span>48 h ago</span>
        <span>
          Range {min.toFixed(2)}–{max.toFixed(2)} m
        </span>
        <span>now</span>
      </figcaption>
    </figure>
  );
}
