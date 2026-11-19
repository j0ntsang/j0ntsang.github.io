import { Label, Meter } from "react-aria-components";

type Props = {
  label: string;
  value: number;
  max: number;
  valueText: string;
  /** Tone of the filled bar. */
  tone: "low" | "moderate" | "high";
};

const TONE = { low: "bg-live", moderate: "bg-stale", high: "bg-down" } as const;

export function IndexMeter({ label, value, max, valueText, tone }: Props) {
  return (
    <Meter value={Math.min(value, max)} maxValue={max} valueLabel={valueText} className="flex flex-col gap-1.5">
      {({ percentage, valueText }) => (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <Label className="text-sm text-muted">{label}</Label>
            <span className="text-sm font-medium text-ink">{valueText}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full rounded-full ${TONE[tone]}`} style={{ width: `${percentage}%` }} />
          </div>
        </>
      )}
    </Meter>
  );
}
