// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Envelope } from "@/lib/envelope";
import type { Highways } from "@/sources/adapters/nb511";
import { HighwayCard } from "./RoadCards";

const envelope = (data: Highways): Envelope<Highways> => ({
  ok: true,
  sourceId: "nb511",
  data,
  observedAt: "2026-11-19T12:00:00Z",
  timeBasis: "checked",
  fetchedAt: "2026-11-19T12:00:00Z",
});

afterEach(cleanup);

describe("HighwayCard", () => {
  it("shows closures and road conditions", () => {
    render(
      <HighwayCard
        envelope={envelope({
          events: [
            { id: "1", road: "HWY-102", direction: null, description: "Bridge repair. All lanes closed.", kind: "closures", fullClosure: true, lanes: null, start: null, end: null, updated: null },
          ],
          conditions: [
            { road: "HWY-7", where: "From Finnegan Hill to Saint John", condition: "Partly snow covered", updated: null },
            { road: "HWY-8", where: "From Boiestown to Blackville", condition: "Bare Dry", updated: null },
            { road: "HWY-2", where: "From Fredericton to Coytown", condition: "Bare Dry", updated: null },
          ],
        })}
      />,
    );
    expect(screen.getByText("Closed: HWY-102")).toBeTruthy();
    expect(screen.getByText("Bridge repair. All lanes closed.")).toBeTruthy();
    expect(screen.getByText("HWY-7, From Finnegan Hill to Saint John")).toBeTruthy();
    expect(screen.getByText(": Partly snow covered")).toBeTruthy();
    expect(screen.queryByText(/Boiestown/)).toBeNull();
    expect(screen.getByText("2 other sections within 50 km are bare and dry.")).toBeTruthy();
  });

  it("summarizes when every section is bare and dry", () => {
    const clear = { where: null, condition: "Bare Dry", updated: null };
    render(<HighwayCard envelope={envelope({ events: [], conditions: [{ road: "HWY-8", ...clear }, { road: "HWY-2", ...clear }] })} />);
    expect(screen.getByText("All 2 sections within 50 km are bare and dry.")).toBeTruthy();
  });

  it("says so when nothing is reported nearby", () => {
    render(<HighwayCard envelope={envelope({ events: [], conditions: [] })} />);
    expect(screen.getByText(/No closures, incidents or roadwork reported within 50 km/)).toBeTruthy();
    expect(screen.queryByText("Road conditions")).toBeNull();
  });
});
