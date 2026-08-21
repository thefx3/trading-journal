import type { Trade, TradeResult } from "@/types/database";
import { TIMEFRAMES } from "./config";
type ResultFilter = "win" | "loss" | "be";
function matchesR(value: number | null, result: TradeResult | null, filter: ResultFilter) { if (value == null) return false; if (filter === "win") return value > 0; if (filter === "loss") return value < 0; return value === 0 && result !== "open"; }
export function matchesResultFilter(trade: Trade, filter?: string) { if (!filter) return true; if (filter !== "win" && filter !== "loss" && filter !== "be") return true; if (trade.journal_mode === "study" && trade.study_entries.length) return trade.study_entries.some((entry) => matchesR(Number(entry.realized_r), entry.result, filter)); return matchesR(trade.realized_r == null ? null : Number(trade.realized_r), trade.result, filter); }

const TIMEFRAME_BY_KEY = new Map(TIMEFRAMES.map((timeframe) => [timeframe.toLowerCase(), timeframe]));
type Timeframe = (typeof TIMEFRAMES)[number];

export function parseTimeframeFilter(value?: string) {
  if (!value) return [];
  return [...new Set(value.split(",").map((item) => TIMEFRAME_BY_KEY.get(item.trim().toLowerCase())).filter((item): item is Timeframe => item !== undefined))];
}

export function matchesTimeframeFilter(trade: Trade, selected: readonly string[]) {
  if (!selected.length) return true;
  const available = new Set(trade.images.map((image) => image.timeframe.toLowerCase()));
  return selected.every((timeframe) => available.has(timeframe.toLowerCase()));
}
