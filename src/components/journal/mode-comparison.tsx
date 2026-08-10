import Link from "next/link";
import { Metrics } from "@/components/trades/metrics";
import { TradeList } from "@/components/trades/trade-list";
import { JOURNAL_MODES } from "@/lib/trading/config";
import { expandStudyEntries } from "@/lib/trading/study";
import { calculateMetrics } from "@/lib/trading/metrics";
import { cn } from "@/lib/utils";
import type { JournalMode, Trade } from "@/types/database";

export type ComparisonMode = Extract<JournalMode, "live" | "study" | "practice">;
const MODES: ComparisonMode[] = ["live", "study", "practice"];
const MODE_TEXT: Record<ComparisonMode, string> = { live: "text-live", study: "text-study", practice: "text-practice" };
const MODE_LINE: Record<ComparisonMode, string> = { live: "after:bg-live", study: "after:bg-study", practice: "after:bg-practice" };

export function ModeComparisonColumn({ side, mode, otherMode, date, trades }: { side: "left" | "right"; mode: ComparisonMode; otherMode: ComparisonMode; date: string; trades: Trade[] }) {
  const config = JOURNAL_MODES[mode];
  const modeTrades = trades.filter((trade) => trade.journal_mode === mode);
  const performanceTrades = mode === "study" ? expandStudyEntries(modeTrades) : modeTrades;
  function href(candidate: ComparisonMode) { const nextOther = candidate === otherMode ? mode : otherMode; const left = side === "left" ? candidate : nextOther; const right = side === "right" ? candidate : nextOther; return `/journal/${date}?left=${left}&right=${right}`; }
  return <section className="min-w-0"><div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border"><h2 className={cn("pb-3 text-sm font-semibold uppercase tracking-wide", MODE_TEXT[mode])}>{config.label} performance</h2><nav aria-label={`Select ${side} comparison mode`} className="flex items-end gap-5">{MODES.map((candidate) => <Link key={candidate} href={href(candidate)} scroll={false} prefetch className={cn("relative pb-3 text-sm text-muted transition hover:text-foreground", candidate === mode && [MODE_TEXT[candidate], "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5", MODE_LINE[candidate]])}>{JOURNAL_MODES[candidate].label}</Link>)}</nav></div><Metrics metrics={calculateMetrics(performanceTrades)} rLabel={mode === "study" ? "Potential R" : "Total R"} /><div className="mt-5"><h3 className="mb-3 text-sm font-medium">{config.label} entries <span className="text-muted">({performanceTrades.length})</span></h3><TradeList trades={performanceTrades} /></div></section>;
}
