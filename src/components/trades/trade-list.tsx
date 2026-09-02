import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SESSION_LABELS } from "@/lib/trading/config";
import { formatTimeInZone } from "@/lib/trading/format-time";
import { summarizeStudyTrade } from "@/lib/trading/study-summary";
import type { Trade } from "@/types/database";
import { JournalModeBadge } from "./journal-mode";
import { RValue } from "./result";
import { TradeChartImage } from "./trade-chart-image";
import { TradeReviewBadges } from "./trade-review-badges";

export function TradeList({
  trades,
  timezone,
}: {
  trades: Trade[];
  timezone: string;
}) {
  if (!trades.length)
    return (
      <div className="rounded-lg border border-dashed border-border py-14 text-center">
        <p className="font-medium">No entries yet.</p>
        <p className="mt-1 text-sm text-muted">
          Add your first entry to start building your journal.
        </p>
      </div>
    );
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {trades.map((trade, index) => {
        const parentStudy =
          trade.journal_mode === "study" && trade.realized_r == null;
        const summary = parentStudy ? summarizeStudyTrade(trade) : null;
        const entryAt = summary?.entryAt ?? trade.entry_at;
        const session = summary ? summary.session : trade.session;
        const direction = summary ? summary.direction : trade.direction;
        const plannedRr = summary ? summary.plannedRr : trade.planned_rr;
        return (
          <Link
            key={`${trade.id}-${trade.entry_at ?? "analysis"}-${index}`}
            href={`/trades/${trade.id}`}
            className="grid grid-cols-[1fr_auto] items-center gap-4 bg-surface/60 p-4 transition hover:bg-control-hover sm:grid-cols-[120px_1fr_170px_90px]"
          >
            <div className="hidden text-sm text-secondary sm:block">
              {format(new Date(`${trade.trade_date}T12:00:00`), "MMM d, yyyy")}
              <div className="mt-1 font-mono text-xs text-muted">
                {entryAt ? formatTimeInZone(entryAt, timezone) : "Analysis"}
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              {trade.images[0]?.signed_url ? (
                <span className="block w-16 shrink-0 overflow-hidden rounded border border-border">
                  <TradeChartImage
                    image={trade.images[0]}
                    alt="Chart"
                    interactive={false}
                  />
                </span>
              ) : (
                <div className="aspect-[4/3] w-16 shrink-0 rounded bg-control" />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{trade.instrument.symbol}</strong>
                  <JournalModeBadge mode={trade.journal_mode} />
                  {direction ? (
                    <Badge
                      className={
                        direction === "long" ? "text-positive" : "text-negative"
                      }
                    >
                      {direction}
                    </Badge>
                  ) : null}
                  {trade.journal_mode !== "study" ? <TradeReviewBadges trade={trade} /> : null}
                </div>
                <p className="mt-1 truncate text-xs text-secondary">
                  {session
                    ? SESSION_LABELS[session]
                    : trade.study_entries.length > 1
                      ? "Multiple sessions"
                      : "Analysis"}
                  {plannedRr != null ? ` · 1:${plannedRr}` : ""}
                </p>
              </div>
            </div>
            <span className="hidden truncate text-sm text-secondary sm:block">
              {trade.setup?.name ?? "No model"}
            </span>
            {trade.trade_status === "missed" ? (
              <div className="text-right">
                <span className="block text-xs font-semibold text-amber-400">MISSED</span>
                {trade.theoretical_r != null ? <span className="mt-1 block font-mono text-xs text-muted">Model {Number(trade.theoretical_r) > 0 ? "+" : ""}{Number(trade.theoretical_r)}R</span> : null}
              </div>
            ) : trade.realized_r != null ? (
              <RValue value={trade.realized_r} className="text-right" />
            ) : trade.journal_mode === "study" ? (
              <span className="text-right text-xs font-medium text-study">
                {trade.study_entries.length} entr
                {trade.study_entries.length === 1 ? "y" : "ies"}
              </span>
            ) : (
              <span className="text-right text-xs font-medium text-muted">
                —
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
