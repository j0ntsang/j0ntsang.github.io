import { describe, expect, it } from "vitest";
import { formatDate, formatMinute } from "./format";

describe("formatDate", () => {
  const now = new Date("2026-11-19T12:00:00Z");
  it("leaves the year off this year's dates", () => expect(formatDate("2026-11-03T15:00:00Z", now)).toBe("Nov 3"));
  it("shows the year on older dates", () => expect(formatDate("2025-03-26T14:10:45Z", now)).toBe("Mar 26, 2025"));
});

describe("formatMinute", () => {
  it("wraps times past midnight", () => expect(formatMinute(1460)).toBe(formatMinute(20)));
});
