import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade } from "@/types/database";
import { JournalModeBadge } from "./journal-mode";
import { RValue } from "./result";
import { TradeChartImage } from "./trade-chart-image";
import { TradeReviewBadges } from "./trade-review-badges";

export function TradeList({ trades }: { trades: Trade[]; timezone?: string }) {
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
    <div className="surface divide-y divide-border/80 overflow-hidden">
      {trades.map((trade) => (
        <Link
          key={trade.id}
          href={`/trades/${trade.id}`}
          className="grid grid-cols-[1fr_auto] items-center gap-4 p-4 transition hover:bg-primary/[0.045] sm:grid-cols-[120px_minmax(0,1fr)_150px_100px]"
        >
          <div className="hidden text-sm text-secondary sm:block">
            {format(new Date(`${trade.trade_date}T12:00:00`), "MMM d, yyyy")}
          </div>
          <div className="flex min-w-0 items-center gap-3">
            {trade.images[0]?.signed_url ? (
              <span className="block w-16 shrink-0 overflow-hidden rounded-lg border border-primary/10 bg-surface-raised">
                <TradeChartImage
                  image={trade.images[0]}
                  alt="Chart"
                  interactive={false}
                />
              </span>
            ) : (
              <div className="aspect-[4/3] w-16 shrink-0 rounded-md bg-control" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{trade.instrument.symbol}</strong>
                <JournalModeBadge mode={trade.journal_mode} />
                {trade.direction ? (
                  <Badge
                    className={
                      trade.direction === "long"
                        ? "text-positive"
                        : "text-negative"
                    }
                  >
                    {trade.direction}
                  </Badge>
                ) : null}
                <TradeReviewBadges trade={trade} />
              </div>
              <p className="mt-1 truncate text-xs text-secondary sm:hidden">
                {SESSION_LABELS[trade.session]} ·{" "}
                {format(
                  new Date(`${trade.trade_date}T12:00:00`),
                  "MMM d, yyyy",
                )}
              </p>
            </div>
          </div>
          <span className="hidden truncate text-sm text-secondary sm:block">
            {SESSION_LABELS[trade.session]}
          </span>
          <div className="text-right">
            <RValue value={Number(trade.realized_r ?? 0)} />
            {trade.trade_status === "missed" ? (
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-amber-400">
                Informative
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
