import type { Trade } from "@/types/database";
import { format, parseISO, startOfWeek } from "date-fns";

export function calculateMetrics(trades: Trade[]) {
  const taken = trades.filter((trade) => trade.trade_status !== "missed");
  const wins = taken.filter((trade) => trade.result === "win").length;
  const losses = taken.filter((trade) => trade.result === "loss").length;
  const breakEven = taken.filter((trade) => trade.result === "be").length;
  const closed = wins + losses + breakEven;
  const totalR = taken.reduce(
    (sum, trade) => sum + Number(trade.realized_r ?? 0),
    0,
  );
  const grossWins = taken.reduce(
    (sum, trade) => sum + Math.max(0, Number(trade.realized_r ?? 0)),
    0,
  );
  const grossLosses = Math.abs(
    taken.reduce(
      (sum, trade) => sum + Math.min(0, Number(trade.realized_r ?? 0)),
      0,
    ),
  );
  return {
    total: taken.length,
    totalTrades: taken.length,
    wins,
    losses,
    breakEven,
    totalR,
    winRate: closed ? (wins / closed) * 100 : 0,
    averageR: closed ? totalR / closed : 0,
    profitFactor: grossLosses
      ? grossWins / grossLosses
      : grossWins
        ? Infinity
        : 0,
  };
}

export type PerformanceMetrics = ReturnType<typeof calculateMetrics>;

export function calculateWeeklyOverview(trades: Trade[], selectedDate: string) {
  const start = format(
    startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );
  const counted = trades.filter(
    (trade) =>
      trade.journal_mode === "live" &&
      trade.trade_status !== "missed" &&
      trade.trade_date >= start &&
      trade.trade_date <= selectedDate,
  );
  const daily = counted.reduce((days, trade) => {
    days.set(
      trade.trade_date,
      (days.get(trade.trade_date) ?? 0) + Number(trade.realized_r ?? 0),
    );
    return days;
  }, new Map<string, number>());
  const values = [...daily.values()];
  const cumulativeR = values.reduce((sum, value) => sum + value, 0);
  const daysTraded = values.length;
  const greenDays = values.filter((value) => value > 0).length;
  return {
    cumulativeR,
    daysTraded,
    greenDays,
    averagePerDay: daysTraded ? cumulativeR / daysTraded : 0,
    bestDay: values.length ? Math.max(...values) : 0,
  };
}

export type WeeklyOverviewMetrics = ReturnType<typeof calculateWeeklyOverview>;
