import { describe, expect, it } from "vitest";
import { matchesTimeframeFilter, parseTimeframeFilter } from "./filters";
import type { Trade } from "../../types/database";

function tradeWithTimeframes(...timeframes: string[]) {
  return { images: timeframes.map((timeframe) => ({ timeframe })) } as Trade;
}

describe("timeframe filters", () => {
  it("normalizes, validates and deduplicates URL values", () => {
    expect(parseTimeframeFilter("1h,30MIN,1H,invalid")).toEqual(["1H", "30min"]);
  });

  it("matches every selected timeframe, not merely one", () => {
    const trade = tradeWithTimeframes("1H", "30min", "5min");
    expect(matchesTimeframeFilter(trade, ["1H"])).toBe(true);
    expect(matchesTimeframeFilter(trade, ["1H", "30min"])).toBe(true);
    expect(matchesTimeframeFilter(trade, ["1H", "15min"])).toBe(false);
  });

  it("does not filter when nothing is selected", () => {
    expect(matchesTimeframeFilter(tradeWithTimeframes(), [])).toBe(true);
  });
});
