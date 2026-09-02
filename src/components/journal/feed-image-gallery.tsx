"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteTradeImage } from "@/app/actions/trades";
import { TradeChartImage } from "@/components/trades/trade-chart-image";
import type { TradeImage } from "@/types/database";

const MODAL_PAGE_SIZE = 3;
const PREVIEW_PAGE_SIZE = 4;
const labels = {
  htf_analysis: "HTF Analysis",
  setup: "Setup",
  entry: "Entry",
  management: "Management",
  exit: "Exit",
  other: "Chart",
} as const;

export function FeedImageGallery({ images, variant = "feed", tradeId }: { images: TradeImage[]; variant?: "feed" | "detail"; tradeId?: string }) {
  const [open, setOpen] = useState(false);
  const [pageStart, setPageStart] = useState(0);
  const [previewStart, setPreviewStart] = useState(0);
  const visible = images.slice(pageStart, pageStart + MODAL_PAGE_SIZE);
  const previewImages = images.slice(
    previewStart,
    previewStart + PREVIEW_PAGE_SIZE,
  );
  const previous = () =>
    setPageStart((value) => Math.max(0, value - MODAL_PAGE_SIZE));
  const next = () =>
    setPageStart((value) =>
      Math.min(
        Math.floor((images.length - 1) / MODAL_PAGE_SIZE) * MODAL_PAGE_SIZE,
        value + MODAL_PAGE_SIZE,
      ),
    );
  function openAt(index: number) {
    setPageStart(Math.floor(index / MODAL_PAGE_SIZE) * MODAL_PAGE_SIZE);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowLeft")
        setPageStart((value) => Math.max(0, value - MODAL_PAGE_SIZE));
      if (event.key === "ArrowRight")
        setPageStart((value) =>
          Math.min(
            Math.floor((images.length - 1) / MODAL_PAGE_SIZE) * MODAL_PAGE_SIZE,
            value + MODAL_PAGE_SIZE,
          ),
        );
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [images.length, open]);

  return (
    <>
      {variant === "detail" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <figure key={image.id} className="relative overflow-hidden rounded-lg border border-border bg-surface">
              {tradeId ? (
                <form action={deleteTradeImage} className="absolute right-2 top-2 z-10">
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="tradeId" value={tradeId} />
                  <button aria-label="Delete chart" className="grid h-7 w-7 cursor-pointer place-items-center rounded bg-background/90 text-negative transition hover:bg-negative/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              ) : null}
              <button type="button" aria-label={`Open ${labels[image.image_type]} chart gallery`} onClick={() => openAt(index)} className="block w-full cursor-zoom-in text-left">
                <TradeChartImage image={image} alt={`${image.image_type} ${image.timeframe} chart`} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 35vw" frameAspect={image.capture_preset === "standard" ? "1:1" : "4:3"} className="rounded-none" interactive={false} />
              </button>
            </figure>
          ))}
        </div>
      ) : (
      <div className="relative mx-auto mt-3 w-full px-7">
        {previewStart > 0 ? (
          <button
            type="button"
            aria-label="Previous preview charts"
            onClick={() =>
              setPreviewStart((value) => Math.max(0, value - PREVIEW_PAGE_SIZE))
            }
            className="absolute left-0 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md border border-border bg-background/90 shadow-sm transition hover:bg-control-hover"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
        <div className="grid grid-cols-4 items-start gap-3">
          {previewImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Open ${labels[image.image_type]} chart`}
              className="block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border text-left"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openAt(previewStart + index);
              }}
            >
              <TradeChartImage
                image={image}
                alt={`${labels[image.image_type]} chart`}
                frameAspect={
                  image.capture_preset === "standard" ? "1:1" : "4:3"
                }
                interactive={false}
              />
            </button>
          ))}
        </div>
        {previewStart + PREVIEW_PAGE_SIZE < images.length ? (
          <button
            type="button"
            aria-label="Next preview charts"
            onClick={() =>
              setPreviewStart((value) =>
                Math.min(
                  Math.floor((images.length - 1) / PREVIEW_PAGE_SIZE) *
                    PREVIEW_PAGE_SIZE,
                  value + PREVIEW_PAGE_SIZE,
                ),
              )
            }
            className="absolute right-0 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md border border-border bg-background/90 shadow-sm transition hover:bg-control-hover"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      )}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Trade charts"
          className="fixed inset-0 z-[100] flex items-center bg-background/65 px-4 py-16 backdrop-blur-md sm:px-16"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-20 grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-border bg-background/85 text-foreground shadow-lg transition hover:bg-control-hover sm:right-8 sm:top-8"
          >
            <X className="h-5 w-5" />
          </button>
          {pageStart > 0 ? (
            <button
              type="button"
              aria-label="Previous charts"
              onClick={(event) => {
                event.stopPropagation();
                previous();
              }}
              className="absolute left-2 z-20 grid h-11 w-11 cursor-pointer place-items-center rounded-md border border-border bg-background/85 shadow-lg transition hover:bg-control-hover sm:left-5"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : null}
          <div
            className={`mx-auto grid max-h-full w-full max-w-[1600px] gap-3 sm:gap-5 ${visible.length === 1 ? "max-w-2xl grid-cols-1" : visible.length === 2 ? "max-w-5xl sm:grid-cols-2" : "sm:grid-cols-3"}`}
            onClick={(event) => event.stopPropagation()}
          >
            {visible.map((image) => (
              <figure key={image.id} className="min-w-0">
                <div className="relative mx-auto aspect-[4/3] max-h-[72vh] w-full overflow-hidden bg-chart-frame shadow-xl">
                  <Image
                    src={image.signed_url!}
                    alt={`${labels[image.image_type]} chart`}
                    fill
                    sizes="(max-width: 640px) 92vw, 32vw"
                    className="object-contain"
                    priority
                  />
                </div>
                <figcaption className="mt-2 text-center text-xs font-medium text-secondary">
                  {image.timeframe}
                </figcaption>
              </figure>
            ))}
          </div>
          {pageStart + MODAL_PAGE_SIZE < images.length ? (
            <button
              type="button"
              aria-label="Next charts"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
              className="absolute right-2 z-20 grid h-11 w-11 cursor-pointer place-items-center rounded-md border border-border bg-background/85 shadow-lg transition hover:bg-control-hover sm:right-5"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          ) : null}
          {images.length > MODAL_PAGE_SIZE ? (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted">
              {pageStart + 1}-
              {Math.min(pageStart + MODAL_PAGE_SIZE, images.length)} of{" "}
              {images.length}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
