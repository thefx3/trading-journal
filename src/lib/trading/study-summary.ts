import type { Direction, StudyEntry, Trade, TradingSession } from "@/types/database";

function sharedValue<T>(entries: StudyEntry[], select: (entry: StudyEntry) => T): T | null {
  if (!entries.length) return null; const first = select(entries[0]); return entries.every((entry) => select(entry) === first) ? first : null;
}

export type StudySummary = { entryAt: string | null; session: TradingSession | null; direction: Direction | null; plannedRr: number | null };
export function summarizeStudyTrade(trade: Trade): StudySummary {
  const entries = trade.study_entries;
  return { entryAt: entries.length === 1 ? entries[0].entry_at : null, session: sharedValue(entries, (entry) => entry.session), direction: sharedValue(entries, (entry) => entry.direction), plannedRr: sharedValue(entries, (entry) => Number(entry.planned_rr)) };
}
