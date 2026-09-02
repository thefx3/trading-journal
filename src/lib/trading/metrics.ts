import type { Trade } from "@/types/database";

export function calculateMetrics(trades: Trade[]) {
  const taken = trades.filter((trade) => trade.trade_status !== "missed");
  const wins = taken.filter((trade) => trade.result === "win").length;
  const losses = taken.filter((trade) => trade.result === "loss").length;
  const breakEven = taken.filter((trade) => trade.result === "be").length;
  const closed = wins + losses + breakEven;
  const totalR = taken.reduce((sum, trade) => sum + Number(trade.realized_r ?? 0), 0);
  const grossWins = taken.reduce((sum, trade) => sum + Math.max(0, Number(trade.realized_r ?? 0)), 0);
  const grossLosses = Math.abs(taken.reduce((sum, trade) => sum + Math.min(0, Number(trade.realized_r ?? 0)), 0));
  return { total: taken.length, totalTrades: taken.length, wins, losses, breakEven, totalR, winRate: closed ? (wins / closed) * 100 : 0, averageR: closed ? totalR / closed : 0, profitFactor: grossLosses ? grossWins / grossLosses : grossWins ? Infinity : 0 };
}

export function calculateExecutionMetrics(trades: Trade[]) {
  const classified = trades.filter((trade) => trade.journal_mode !== "study" && trade.setup_validity && trade.execution_quality && trade.trade_status);
  const valid = classified.filter((trade) => trade.setup_validity === "valid");
  const modelTracked = valid.filter((trade) => trade.theoretical_r != null);
  const good = valid.filter((trade) => trade.execution_quality === "good").length;
  const bad = valid.filter((trade) => trade.execution_quality === "bad").length;
  const missed = valid.filter((trade) => trade.trade_status === "missed").length;
  const modelR = modelTracked.reduce((sum, trade) => sum + Number(trade.theoretical_r), 0);
  const actualR = modelTracked.reduce((sum, trade) => sum + Number(trade.realized_r ?? 0), 0);
  return { valid: valid.length, good, bad, missed, missedRate: valid.length ? missed / valid.length * 100 : 0, modelR, actualR, executionCost: actualR - modelR, modelTracked: modelTracked.length };
}

export type PerformanceMetrics = ReturnType<typeof calculateMetrics>;

export function performanceTrades(trades: Trade[], mode: "live" | "practice") {
  return trades.filter((trade) => trade.journal_mode === mode);
}

export function calculateStudyMetrics(trades: Trade[]) {
  const studies = trades.filter((trade) => trade.journal_mode === "study");
  return { total: studies.length, setupsFound: studies.filter((trade) => trade.setup_found).length, noSetup: studies.filter((trade) => !trade.setup_found).length };
}
