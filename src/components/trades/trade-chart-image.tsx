"use client";

import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TradeImage } from "@/types/database";

type CropImage = Partial<Pick<TradeImage, "signed_url" | "crop_x" | "crop_y" | "crop_width" | "crop_height" | "crop_zoom" | "crop_rotation">> & { signed_url?: string | null; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number; cropZoom?: number; cropRotation?: number };

function cropStyle(image: CropImage) { const x = Number(image.crop_x ?? image.cropX ?? 0); const y = Number(image.crop_y ?? image.cropY ?? 0); const zoom = Number(image.crop_zoom ?? image.cropZoom ?? 1); return { transform: `translate(${x}%, ${y}%) scale(${zoom})` }; }

export function TradeChartImage({ image, alt, label, sizes = "(max-width: 640px) 100vw, 40vw", interactive = true, frameAspect = "4:3", className }: { image: CropImage; alt: string; label?: string; sizes?: string; interactive?: boolean; frameAspect?: "1:1" | "4:3" | "16:9"; className?: string }) {
  const [open, setOpen] = useState(false); const style = cropStyle(image); const src = image.signed_url;
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false); document.addEventListener("keydown", close); document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; }; }, [open]);
  if (!src) return null;
  const visual = <div className={cn("relative w-full overflow-hidden bg-chart-frame", frameAspect === "1:1" ? "aspect-square" : frameAspect === "16:9" ? "aspect-[16/9]" : "aspect-[4/3]", className)}><div className="absolute inset-0 will-change-transform" style={style}><Image src={src} alt={alt} fill sizes={sizes} className="object-contain" /></div>{label ? <span className="absolute left-2.5 top-2.5 rounded-sm bg-blue-300/25 px-1.5 py-0.5 text-[15px] font-bold uppercase tracking-wide text-black backdrop-blur-[3px] [text-shadow:0_1px_2px_rgba(255,255,255,.95)]">{label}</span> : null}{interactive ? <Maximize2 className="absolute bottom-2.5 right-2.5 h-4 w-4 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,.9)]" /> : null}</div>;
  return <>{interactive ? <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen(true); }} aria-label={`Open ${alt}`} className="block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border text-left">{visual}</button> : visual}{open ? <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[100] grid place-items-center bg-background/55 p-5 backdrop-blur-md sm:p-10" onClick={() => setOpen(false)}><div className="relative h-[min(72vh,760px)] w-[min(86vw,1080px)] overflow-hidden" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Close image" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-white/15 bg-black/60 text-white transition hover:bg-white/15"><X className="h-4 w-4" /></button><Image src={src} alt={alt} fill sizes="(max-width: 640px) 86vw, 1080px" className="object-contain" priority /></div></div> : null}</>;
}
