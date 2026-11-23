import Link from "next/link";
import { format } from "date-fns";
import { JournalModeMarker } from "@/components/trades/journal-mode";
import { RValue } from "@/components/trades/result";
import { TradeChartImage } from "@/components/trades/trade-chart-image";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade } from "@/types/database";

export function TradeCardView({ trades }: { trades: Trade[] }) {
  return (
    <div className="grid gap-4">
      {trades.map((trade) => {
        const direction = trade.direction
          ? `${trade.direction[0].toUpperCase()}${trade.direction.slice(1)}`
          : "—";
        const images = trade.images.filter((image) => image.signed_url);
        return (
          <article
            key={trade.id}
            className="surface overflow-hidden transition hover:border-primary/20"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 px-4 py-3.5 sm:px-5">
              <time
                dateTime={trade.trade_date}
                className="text-xs text-muted sm:min-w-24"
              >
                {format(
                  new Date(`${trade.trade_date}T12:00:00`),
                  "MMM d, yyyy",
                )}
              </time>
              <Link
                href={`/trades/${trade.id}`}
                className="group flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <JournalModeMarker mode={trade.journal_mode} />
                <p className="truncate text-sm text-secondary transition group-hover:text-foreground sm:text-base">
                  <strong className="font-semibold text-foreground">
                    {trade.instrument.symbol}
                  </strong>
                  <span className="mx-2 text-subtle">|</span>
                  {direction}
                  <span className="mx-2 text-subtle">|</span>
                  {SESSION_LABELS[trade.session]}
                </p>
              </Link>
              <RValue
                value={Number(trade.realized_r ?? 0)}
                className="ml-auto text-xl font-semibold"
              />
            </div>
            <div className="p-4 sm:p-5">
              {images.length ? (
                <div className="flex snap-x items-start gap-3 overflow-x-auto overscroll-x-contain pb-1">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="w-48 shrink-0 snap-start sm:w-56 lg:w-64 xl:w-72"
                    >
                      <TradeChartImage
                        image={image}
                        alt={`${trade.instrument.symbol} ${image.timeframe} chart`}
                        label={image.timeframe}
                        sizes="(max-width: 640px) 12rem, (max-width: 1024px) 14rem, 18rem"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Link
                  href={`/trades/${trade.id}`}
                  className="grid min-h-28 place-items-center rounded-lg border border-dashed border-border/70 text-sm text-subtle transition hover:border-primary/25 hover:text-muted"
                >
                  No charts attached
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
