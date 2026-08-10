import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { JournalModeBadge } from "@/components/trades/journal-mode";
import { RValue } from "@/components/trades/result";
import { FeedImageGallery } from "@/components/journal/feed-image-gallery";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade } from "@/types/database";

export function FeedCard({ trade }: { trade: Trade }) {
  const isStudy = trade.journal_mode === "study";
  const charts = trade.images
    .filter((image) => Boolean(image.signed_url))
    .slice(0, 6);
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface-raised/75 shadow-sm transition hover:border-primary/35 hover:bg-surface-raised">
      <div className="p-4 sm:p-5">
        <Link
          href={`/trades/${trade.id}`}
          prefetch
          className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <strong className="text-base">{trade.instrument.symbol}</strong>
              <JournalModeBadge mode={trade.journal_mode} />
              {trade.direction ? (
                <Badge
                  className={
                    trade.direction === "long"
                      ? "border-positive/30 bg-positive/8 text-positive"
                      : "border-negative/30 bg-negative/8 text-negative"
                  }
                >
                  {trade.direction.toUpperCase()}
                </Badge>
              ) : null}
              <Badge className="border-border bg-control text-secondary">
                {trade.setup?.name ?? "No model"}
              </Badge>
            </div>
            {isStudy ? (
              <span className="text-sm font-semibold text-study">
                {trade.study_entries.length} entries
              </span>
            ) : trade.realized_r != null ? (
              <RValue value={trade.realized_r} className="text-lg" />
            ) : null}
          </header>
          <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-secondary">
            <span>
              {format(new Date(`${trade.trade_date}T12:00:00`), "d MMM yyyy")}
            </span>
            {trade.entry_at ? (
              <span>{format(new Date(trade.entry_at), "HH:mm")}</span>
            ) : null}
            <span>{SESSION_LABELS[trade.session]}</span>
          </div>
        </Link>
        {charts.length ? <FeedImageGallery images={charts} /> : null}
        {trade.notes ? (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">
            {trade.notes}
          </p>
        ) : null}
      </div>
    </article>
  );
}
