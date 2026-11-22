import Link from "next/link";
import { TradeList } from "@/components/trades/trade-list";
import { JOURNAL_MODES } from "@/lib/trading/config";
import { calculateMetrics } from "@/lib/trading/metrics";
import { cn } from "@/lib/utils";
import type { JournalMode, Trade } from "@/types/database";

export type ComparisonMode = Extract<
  JournalMode,
  "live" | "study" | "practice"
>;
const MODES: ComparisonMode[] = ["live", "study", "practice"];
const MODE_TEXT: Record<ComparisonMode, string> = {
  live: "text-live",
  study: "text-study",
  practice: "text-practice",
};
const MODE_LINE: Record<ComparisonMode, string> = {
  live: "after:bg-live",
  study: "after:bg-study",
  practice: "after:bg-practice",
};

export function ModeComparisonColumn({
  side,
  mode,
  otherMode,
  date,
  trades,
  timezone,
}: {
  side: "left" | "right";
  mode: ComparisonMode;
  otherMode: ComparisonMode;
  date: string;
  trades: Trade[];
  timezone: string;
}) {
  const config = JOURNAL_MODES[mode];
  const modeTrades = trades.filter((trade) => trade.journal_mode === mode);
  const metrics = calculateMetrics(modeTrades);
  function href(candidate: ComparisonMode) {
    const nextOther = candidate === otherMode ? mode : otherMode;
    const left = side === "left" ? candidate : nextOther;
    const right = side === "right" ? candidate : nextOther;
    return `/journal/${date}?left=${left}&right=${right}`;
  }
  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border">
        <h2
          className={cn(
            "pb-3 text-sm font-semibold uppercase tracking-wide",
            MODE_TEXT[mode],
          )}
        >
          {config.label} performance
        </h2>
        <nav
          aria-label={`Select ${side} comparison mode`}
          className="flex items-end gap-5"
        >
          {MODES.map((candidate) => (
            <Link
              key={candidate}
              href={href(candidate)}
              scroll={false}
              prefetch
              className={cn(
                "relative pb-3 text-sm text-muted transition hover:text-foreground",
                candidate === mode && [
                  MODE_TEXT[candidate],
                  "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5",
                  MODE_LINE[candidate],
                ],
              )}
            >
              {JOURNAL_MODES[candidate].label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mb-5 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-surface/40">
        <div className="p-3">
          <span className="text-xs text-muted">R</span>
          <strong className="mt-1 block font-mono">
            {metrics.totalR > 0 ? "+" : ""}
            {metrics.totalR.toFixed(1)}R
          </strong>
        </div>
        <div className="p-3">
          <span className="text-xs text-muted">Trades</span>
          <strong className="mt-1 block font-mono">{metrics.total}</strong>
        </div>
        <div className="p-3">
          <span className="text-xs text-muted">Win rate</span>
          <strong className="mt-1 block font-mono">
            {metrics.winRate.toFixed(0)}%
          </strong>
        </div>
      </div>
      <div className="mt-5">
        <h3 className="mb-3 text-sm font-medium">
          {config.label} entries{" "}
          <span className="text-muted">({modeTrades.length})</span>
        </h3>
        <TradeList trades={modeTrades} timezone={timezone} />
      </div>
    </section>
  );
}
