import Link from "next/link";
import { format } from "date-fns";
import { FeedImageGallery } from "@/components/journal/feed-image-gallery";
import { RValue } from "@/components/trades/result";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade } from "@/types/database";

export function FeedCard({ trade }: { trade: Trade }) {
  const charts = trade.images
    .filter((image) => Boolean(image.signed_url))
    .slice(0, 6);
  const isLong = trade.direction === "long";
  return (
    <article className="py-5 first:pt-4 last:pb-4 sm:py-6">
      <Link
        href={`/trades/${trade.id}`}
        prefetch
        className="flex items-start justify-between gap-5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={
              isLong
                ? "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-positive/12 text-xs font-bold text-positive"
                : "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-negative/12 text-xs font-bold text-negative"
            }
          >
            {isLong ? "L" : "S"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-secondary sm:text-base">
              <strong className="text-foreground">
                {trade.instrument.symbol}{" "}
                {trade.direction
                  ? `${trade.direction[0].toUpperCase()}${trade.direction.slice(1)}`
                  : ""}
              </strong>
              <span className="mx-2 text-border">|</span>
              {SESSION_LABELS[trade.session]}
              <span className="mx-2 text-border">|</span>
              {format(new Date(`${trade.trade_date}T12:00:00`), "dd.MM.yy")}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-subtle">
              {trade.journal_mode}
              {trade.trade_status === "missed" ? " · missed" : ""}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <RValue
            value={Number(trade.realized_r ?? 0)}
            className="text-xl font-semibold sm:text-2xl"
          />
          {trade.trade_status === "missed" ? (
            <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-amber-400">
              Informative
            </span>
          ) : null}
        </div>
      </Link>
      {charts.length ? <FeedImageGallery images={charts} /> : null}
    </article>
  );
}
