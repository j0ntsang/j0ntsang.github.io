// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Envelope } from "@/lib/envelope";
import { NeedsAttention } from "./NeedsAttention";

const ok = <T,>(sourceId: string, data: T): Envelope<T> => ({
  ok: true,
  sourceId,
  data,
  observedAt: "2026-11-19T12:00:00Z",
  timeBasis: "observed",
  fetchedAt: "2026-11-19T12:00:00Z",
});

const quiet = {
  weather: ok("eccc-citypage", { warnings: [] } as never),
  river: ok("eccc-hydrometric", { levelM: 1, floodStageM: 6.5 } as never),
  aqhi: ok("eccc-aqhi", { value: 2, risk: "Low" } as never),
  highways: ok("nb511", { events: [], conditions: [] }),
  downCount: 0,
};

const event = { direction: null, description: null, lanes: null, start: null, updated: null };

afterEach(cleanup);

describe("NeedsAttention", () => {
  it("renders nothing when nothing needs attention", () => {
    const { container } = render(<NeedsAttention {...quiet} closures={ok("city-closures", [])} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing while sources are still loading", () => {
    const { container } = render(<NeedsAttention weather={null} river={null} aqhi={null} closures={null} highways={null} downCount={0} />);
    expect(container.innerHTML).toBe("");
  });

  it("lists a closed street, but not one marked caution", () => {
    const closures = ok("city-closures", [
      { street: "Queen Street", status: "Closed" as const, since: null },
      { street: "Holland Street", status: "Caution" as const, since: null },
    ]);
    render(<NeedsAttention {...quiet} closures={closures} />);
    expect(screen.getByRole("heading", { name: "Needs attention" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Queen Street is closed" })).toBeTruthy();
    expect(screen.queryByText(/Holland Street/)).toBeNull();
  });

  it("lists a highway closure ending soon, but not one lasting years", () => {
    const soon = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const highways = ok("nb511", {
      events: [
        { ...event, id: "1", road: "HWY-102", kind: "closures", fullClosure: true, end: soon },
        { ...event, id: "2", road: "Mast Rd", kind: "closures", fullClosure: true, end: "2031-01-01T14:22:00Z" },
        { ...event, id: "3", road: "HWY-2", kind: "roadwork", fullClosure: false, end: soon },
      ],
      conditions: [],
    });
    render(<NeedsAttention {...quiet} closures={ok("city-closures", [])} highways={highways} />);
    expect(screen.getByRole("link", { name: "HWY-102 is closed" })).toBeTruthy();
    expect(screen.queryByText(/Mast Rd/)).toBeNull();
    expect(screen.queryByText(/HWY-2\b/)).toBeNull();
  });
});
