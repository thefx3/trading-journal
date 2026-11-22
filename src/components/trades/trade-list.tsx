import Link from "next/link";
import { format } from "date-fns";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade } from "@/types/database";
import { JournalModeMarker } from "./journal-mode";
import { RValue } from "./result";
import { TradeChartImage } from "./trade-chart-image";

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
      {trades.map((trade) => {
        const direction = trade.direction
          ? `${trade.direction[0].toUpperCase()}${trade.direction.slice(1)}`
          : "—";
        return (
          <Link
            key={trade.id}
            href={`/trades/${trade.id}`}
            className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4 transition hover:bg-primary/[0.045] sm:grid-cols-[120px_minmax(0,1fr)_100px]"
          >
            <div className="hidden text-sm text-muted sm:block">
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
                <div className="aspect-[4/3] w-16 shrink-0 rounded-lg border border-primary/5 bg-control" />
              )}
              <div className="flex min-w-0 items-center gap-3">
                <JournalModeMarker mode={trade.journal_mode} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-secondary transition group-hover:text-foreground sm:text-base">
                    <strong className="font-semibold text-foreground">
                      {trade.instrument.symbol}
                    </strong>
                    <span className="mx-2 text-subtle">|</span>
                    {direction}
                    <span className="mx-2 text-subtle">|</span>
                    {SESSION_LABELS[trade.session]}
                  </p>
                  <p className="mt-1 truncate text-xs text-subtle sm:hidden">
                    {format(
                      new Date(`${trade.trade_date}T12:00:00`),
                      "MMM d, yyyy",
                    )}
                  </p>
                </div>
              </div>
            </div>
            <RValue
              value={Number(trade.realized_r ?? 0)}
              className="text-right text-lg font-semibold"
            />
          </Link>
        );
      })}
    </div>
  );
}
