import type { ImageType, JournalMode, TradingSession } from "@/types/database";

export const JOURNAL_MODES: Record<JournalMode, { label: string; description: string; badgeClass: string; activeClass: string }> = {
  live: { label: "Live", description: "Executed in real market conditions.", badgeClass: "border-live/35 bg-live/10 text-live", activeClass: "border-live/50 bg-live/10 text-live" },
  study: { label: "Study", description: "Review historical price action and study your model.", badgeClass: "border-study/35 bg-study/10 text-study", activeClass: "border-study/50 bg-study/10 text-study" },
  practice: { label: "Practice", description: "Practice on historical price action without knowing what comes next.", badgeClass: "border-practice/35 bg-practice/10 text-practice", activeClass: "border-practice/50 bg-practice/10 text-practice" },
};

export function normalizeJournalMode(value: unknown): JournalMode {
  return value === "study" || value === "practice" ? value : "live";
}

export const FUTURES = new Set(["NQ", "MNQ", "ES", "MES", "YM", "MYM", "RTY", "M2K", "GC", "MGC", "CL", "MCL", "SI", "SIL"]);
export const INSTRUMENT_GROUPS = {
  NQ: ["NQ", "MNQ"], ES: ["ES", "MES"], YM: ["YM", "MYM"], RTY: ["RTY", "M2K"],
  GC: ["GC", "MGC"], CL: ["CL", "MCL"], SI: ["SI", "SIL"], BTC: ["BTC"], ETH: ["ETH"],
  EURUSD: ["EURUSD"], GBPUSD: ["GBPUSD"], XAUUSD: ["XAUUSD"],
} as const;
export type InstrumentGroup = keyof typeof INSTRUMENT_GROUPS;

export function isInstrumentGroup(value: string): value is InstrumentGroup {
  return value in INSTRUMENT_GROUPS;
}
export const RR_PRESETS = [1, 1.5, 2, 2.5, 3] as const;
export const TIMEFRAMES = ["1M", "1W", "1D", "4H", "1H", "30m", "15m", "5m", "3m", "1m", "Other"] as const;
const TIMEFRAME_PRIORITY = new Map<string, number>(TIMEFRAMES.map((timeframe, index) => [timeframe.toLowerCase(), index]));
export function compareTimeframesDescending(a: string, b: string) {
  return (TIMEFRAME_PRIORITY.get(a.toLowerCase()) ?? TIMEFRAMES.length) - (TIMEFRAME_PRIORITY.get(b.toLowerCase()) ?? TIMEFRAMES.length);
}
export const IMAGE_TYPES: { value: ImageType; label: string }[] = [
  { value: "htf_analysis", label: "HTF Analysis" }, { value: "setup", label: "Setup" },
  { value: "entry", label: "Entry" }, { value: "management", label: "Management" },
  { value: "exit", label: "Exit" }, { value: "other", label: "Other" },
];
export const SESSION_LABELS: Record<TradingSession, string> = {
  asia: "Asia", london: "London", new_york_am: "New York AM",
  new_york_lunch: "New York Lunch", new_york_pm: "New York PM", other: "Other",
};
