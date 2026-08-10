import { describe, expect, it } from "vitest";
import { getPreviousTradingDate } from "./previous-trading-date";

describe("getPreviousTradingDate", () => {
  it("returns the nearest earlier date containing trades", () => {
    expect(getPreviousTradingDate(["2026-08-07", "2026-08-10", "2026-08-05"], "2026-08-10")).toBe("2026-08-07");
  });

  it("ignores duplicate dates and future dates", () => {
    expect(getPreviousTradingDate(["2026-08-09", "2026-08-09", "2026-08-11"], "2026-08-10")).toBe("2026-08-09");
  });

  it("returns null when there is no earlier trading day", () => {
    expect(getPreviousTradingDate(["2026-08-10", "2026-08-11"], "2026-08-10")).toBeNull();
  });
});
