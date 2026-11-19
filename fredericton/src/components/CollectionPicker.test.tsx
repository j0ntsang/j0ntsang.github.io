// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CALENDAR, locations } from "@/lib/collection";
import { COLLECTION_LOCATION_KEY } from "@/lib/preferences";
import { CollectionPicker } from "./CollectionPicker";

const TODAY = "2026-11-18";
const crossingZones = locations.find((l) => l.zoneIds.length > 1)!;
const singleZone = locations.find((l) => l.zoneIds.length === 1)!;

const saved = () => localStorage.getItem(COLLECTION_LOCATION_KEY);

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

async function pickLocation(name: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole("combobox"), name);
  await user.click(await screen.findByRole("option", { name: new RegExp(`^${name}`) }));
  return user;
}

describe("CollectionPicker", () => {
  it("shows the empty state when nothing matches the query", async () => {
    render(<CollectionPicker initialLocationId={null} today={TODAY} />);
    await userEvent.setup().type(screen.getByRole("combobox"), "zzzz");

    expect(await screen.findByText(/No match\./)).toBeTruthy();
    expect(screen.queryByRole("option", { name: new RegExp(`^${singleZone.name}`) })).toBeNull();
  });

  it("shows one schedule and no boundary warning for a single-zone location", async () => {
    render(<CollectionPicker initialLocationId={null} today={TODAY} />);
    await pickLocation(singleZone.name);

    expect(screen.queryByText(/crosses a zone boundary/)).toBeNull();
    expect(screen.getAllByText(/^Garbage, every /)).toHaveLength(1);
    expect(saved()).toBe(singleZone.id);
  });

  it("warns and shows a schedule per zone when a location crosses a zone boundary", async () => {
    render(<CollectionPicker initialLocationId={null} today={TODAY} />);
    await pickLocation(crossingZones.name);

    expect(screen.getByText(/crosses a zone boundary/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Check your address on the City.s map/ })).toBeTruthy();
    const sections = screen.getAllByRole("region");
    expect(sections).toHaveLength(crossingZones.zoneIds.length);
    for (const section of sections) {
      expect(within(section).getAllByText(/^Garbage, every /)).toHaveLength(1);
    }
  });

  it("Clear removes the schedule and forgets the saved location", async () => {
    render(<CollectionPicker initialLocationId={null} today={TODAY} />);
    const user = await pickLocation(singleZone.name);
    expect(saved()).toBe(singleZone.id);

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(saved()).toBeNull();
    expect(screen.queryByText(/^Garbage, every /)).toBeNull();
    expect(screen.getByText(/we.ll remember it on this device/)).toBeTruthy();
  });

  it("shows the expired message when today is past the calendar's last day", () => {
    render(<CollectionPicker initialLocationId={singleZone.id} today="2028-01-01" />);

    expect(screen.getByText(/Our copy of the recycling calendar ended/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "See the current calendar" }).getAttribute("href")).toBe(CALENDAR.calendarUrl);
    expect(screen.queryByText(/^Garbage, every /)).toBeNull();
  });
});
