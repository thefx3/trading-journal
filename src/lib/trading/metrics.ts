import type { Trade } from "@/types/database";

export function calculateMetrics(trades: Trade[]) {
  const wins = trades.filter((trade) => trade.result === "win").length;
  const losses = trades.filter((trade) => trade.result === "loss").length;
  const breakEven = trades.filter((trade) => trade.result === "be").length;
  const closed = wins + losses + breakEven;
  const totalR = trades.reduce((sum, trade) => sum + Number(trade.realized_r ?? 0), 0);
  const grossWins = trades.reduce((sum, trade) => sum + Math.max(0, Number(trade.realized_r ?? 0)), 0);
  const grossLosses = Math.abs(trades.reduce((sum, trade) => sum + Math.min(0, Number(trade.realized_r ?? 0)), 0));
  return { total: trades.length, totalTrades: trades.length, wins, losses, breakEven, totalR, winRate: closed ? (wins / closed) * 100 : 0, averageR: closed ? totalR / closed : 0, profitFactor: grossLosses ? grossWins / grossLosses : grossWins ? Infinity : 0 };
}

export type PerformanceMetrics = ReturnType<typeof calculateMetrics>;

export function performanceTrades(trades: Trade[], mode: "live" | "practice") {
  return trades.filter((trade) => trade.journal_mode === mode);
}

export function calculateStudyMetrics(trades: Trade[]) {
  const studies = trades.filter((trade) => trade.journal_mode === "study");
  return { total: studies.length, setupsFound: studies.filter((trade) => trade.setup_found).length, noSetup: studies.filter((trade) => !trade.setup_found).length };
}
