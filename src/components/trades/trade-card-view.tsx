"use client";

import Link from "next/link";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { JournalModeMarker } from "@/components/trades/journal-mode";
import { RValue } from "@/components/trades/result";
import { TradeChartImage } from "@/components/trades/trade-chart-image";
import { cn } from "@/lib/utils";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade, TradeImage } from "@/types/database";

function enlargedRowClass(imageCount: number) {
  if (imageCount === 1) return "w-full max-w-5xl grid-cols-1";
  if (imageCount === 2) return "w-full max-w-[1500px] grid-cols-2";
  return "min-w-full";
}

function TradeCardGallery({
  images,
  symbol,
}: {
  images: TradeImage[];
  symbol: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div className="flex items-start gap-px overflow-x-auto overscroll-x-contain bg-border">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            aria-label={`Open all ${symbol} charts from ${image.timeframe}`}
            onClick={() => setOpen(true)}
            className="w-48 shrink-0 cursor-zoom-in text-left ring-1 ring-inset ring-border focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 sm:w-56 lg:w-64 xl:w-72"
          >
            <TradeChartImage
              image={image}
              alt={`${symbol} ${image.timeframe} chart`}
              label={image.timeframe}
              sizes="(max-width: 640px) 12rem, (max-width: 1024px) 14rem, 18rem"
              className="rounded-none"
              interactive={false}
            />
          </button>
        ))}
      </div>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${symbol} trade charts`}
          className="fixed inset-0 z-[100] flex items-center bg-background/70 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Close charts"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-20 grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg transition hover:bg-control-hover sm:right-8 sm:top-8"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="w-full overflow-x-auto bg-chart-frame shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={cn(
                "grid items-start gap-px bg-border",
                enlargedRowClass(images.length),
              )}
              style={
                images.length > 2
                  ? {
                      gridTemplateColumns: `repeat(${images.length}, minmax(320px, 1fr))`,
                    }
                  : undefined
              }
            >
              {images.map((image) => (
                <div key={image.id} className="ring-1 ring-inset ring-border">
                  <TradeChartImage
                    image={image}
                    alt={`${symbol} ${image.timeframe} chart`}
                    label={image.timeframe}
                    sizes="(max-width: 960px) 320px, 50vw"
                    className="rounded-none"
                    interactive={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

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
            {images.length ? (
              <TradeCardGallery
                images={images}
                symbol={trade.instrument.symbol}
              />
            ) : (
              <div className="p-4 sm:p-5">
                <Link
                  href={`/trades/${trade.id}`}
                  className="grid min-h-28 place-items-center rounded-lg border border-dashed border-border/70 text-sm text-subtle transition hover:border-primary/25 hover:text-muted"
                >
                  No charts attached
                </Link>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
