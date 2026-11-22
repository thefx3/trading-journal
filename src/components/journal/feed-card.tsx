import Link from "next/link";
import { FeedImageGallery } from "@/components/journal/feed-image-gallery";
import { JournalModeMarker } from "@/components/trades/journal-mode";
import { RValue } from "@/components/trades/result";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade } from "@/types/database";

export function FeedCard({ trade }: { trade: Trade }) {
  const charts = trade.images.filter((image) => Boolean(image.signed_url));
  const direction = trade.direction
    ? `${trade.direction[0].toUpperCase()}${trade.direction.slice(1)}`
    : "—";
  return (
    <article className="py-5 first:pt-4 last:pb-4 sm:py-6">
      <Link
        href={`/trades/${trade.id}`}
        prefetch
        className="group flex items-start justify-between gap-5 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <div className="flex min-w-0 items-center gap-3">
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
        </div>
        <RValue
          value={Number(trade.realized_r ?? 0)}
          className="shrink-0 text-xl font-semibold sm:text-2xl"
        />
      </Link>
      {charts.length ? <FeedImageGallery images={charts} /> : null}
    </article>
  );
}
