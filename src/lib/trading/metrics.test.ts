import { describe, expect, it } from "vitest";
import { calculateMetrics, calculateWeeklyOverview } from "./metrics";
import type { Trade } from "@/types/database";

function occurrence(overrides: Partial<Trade>): Trade {
  return {
    id: crypto.randomUUID(),
    user_id: "user",
    instrument_id: "instrument",
    trade_date: "2026-09-02",
    entry_at: "2026-09-02T08:00:00Z",
    direction: "long",
    planned_rr: 2,
    result: "win",
    realized_r: 2,
    journal_mode: "live",
    setup_found: true,
    session: "london",
    session_override: false,
    notes: null,
    visibility: "private",
    setup_validity: "valid",
    execution_quality: "good",
    trade_status: "taken",
    theoretical_r: 2,
    execution_error: null,
    created_at: "",
    updated_at: "",
    instrument: {
      id: "instrument",
      symbol: "NQ",
      display_name: "NQ",
      asset_class: "futures",
      exchange: null,
      market_timezone: "America/New_York",
    },
    images: [],
    study_entries: [],
    ...overrides,
  };
}

describe("performance metrics", () => {
  it("calculates recorded trade performance", () => {
    const trades = [
      occurrence({}),
      occurrence({
        result: "loss",
        realized_r: -1,
      }),
    ];
    expect(calculateMetrics(trades)).toMatchObject({
      total: 2,
      wins: 1,
      losses: 1,
      totalR: 1,
    });
  });

  it("builds the current weekly recap from live trades only", () => {
    const trades = [
      occurrence({ trade_date: "2026-09-07", realized_r: 2 }),
      occurrence({ trade_date: "2026-09-08", result: "loss", realized_r: -1 }),
      occurrence({ trade_date: "2026-09-08", result: "win", realized_r: 3 }),
      occurrence({
        trade_date: "2026-09-09",
        journal_mode: "practice",
        realized_r: 9,
      }),
    ];
    expect(calculateWeeklyOverview(trades, "2026-09-09")).toEqual({
      cumulativeR: 4,
      daysTraded: 2,
      greenDays: 2,
      averagePerDay: 2,
      bestDay: 2,
    });
  });
});
