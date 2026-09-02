import { describe, expect, it } from "vitest";
import { calculateExecutionMetrics, calculateMetrics } from "./metrics";
import type { Trade } from "@/types/database";

function occurrence(overrides: Partial<Trade>): Trade {
  return {
    id: crypto.randomUUID(), user_id: "user", instrument_id: "instrument", setup_id: null,
    trade_date: "2026-09-02", entry_at: "2026-09-02T08:00:00Z", direction: "long",
    planned_rr: 2, result: "win", realized_r: 2, journal_mode: "live", setup_found: true,
    session: "london", session_override: false, notes: null, visibility: "private",
    setup_validity: "valid", execution_quality: "good", trade_status: "taken",
    theoretical_r: 2, execution_error: null, created_at: "", updated_at: "",
    instrument: { id: "instrument", symbol: "NQ", display_name: "NQ", asset_class: "futures", exchange: null, market_timezone: "America/New_York" },
    setup: null, images: [], study_entries: [], ...overrides,
  };
}

describe("execution metrics", () => {
  it("keeps a missed setup out of trade results and actual P&L", () => {
    const trades = [occurrence({}), occurrence({ trade_status: "missed", execution_quality: "bad", execution_error: "hesitation", result: null, realized_r: 0, theoretical_r: 2 })];
    expect(calculateMetrics(trades)).toMatchObject({ total: 1, wins: 1, totalR: 2 });
    expect(calculateExecutionMetrics(trades)).toMatchObject({ valid: 2, good: 1, bad: 1, missed: 1, missedRate: 50, modelR: 4, actualR: 2, executionCost: -2 });
  });
});
