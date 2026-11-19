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
  downCount: 0,
};

afterEach(cleanup);

describe("NeedsAttention", () => {
  it("renders nothing when nothing needs attention", () => {
    const { container } = render(<NeedsAttention {...quiet} closures={ok("city-closures", [])} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing while sources are still loading", () => {
    const { container } = render(<NeedsAttention weather={null} river={null} aqhi={null} closures={null} downCount={0} />);
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
});
