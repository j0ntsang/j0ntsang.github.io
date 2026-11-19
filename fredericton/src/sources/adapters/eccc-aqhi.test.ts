import { describe, expect, it } from "vitest";
import { peakOutlook } from "./eccc-aqhi";

const NOW = Date.parse("2026-11-19T12:00:00Z");
const row = (publication: string, at: string, aqhi: number) => ({
  properties: { publication_datetime: publication, forecast_datetime: at, aqhi },
});

describe("peakOutlook", () => {
  it("takes the worst hour in the next 24 h of the newest forecast", () => {
    const outlook = peakOutlook(
      {
        features: [
          row("2026-11-19T09:00:00Z", "2026-11-19T15:00:00Z", 3),
          row("2026-11-19T09:00:00Z", "2026-11-19T20:00:00Z", 5),
          row("2026-11-19T09:00:00Z", "2026-11-20T18:00:00Z", 9), // beyond 24 h
          row("2026-11-18T21:00:00Z", "2026-11-19T16:00:00Z", 8), // older publication
          row("2026-11-19T09:00:00Z", "2026-11-19T10:00:00Z", 7), // already past
          { properties: { publication_datetime: "2026-11-19T09:00:00Z" } }, // a period summary row
        ],
      },
      NOW,
    );
    expect(outlook).toEqual({ value: 5, risk: "Moderate", at: "2026-11-19T20:00:00Z" });
  });

  it("is null when nothing is forecast for the next day", () => {
    expect(peakOutlook({ features: [] }, NOW)).toBeNull();
  });
});
