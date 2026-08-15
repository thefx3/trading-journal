"use client";

import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TradeChartImage } from "./trade-chart-image";

export type CropState = {
  cropX: number; cropY: number; cropWidth: number; cropHeight: number;
  cropZoom: number; cropRotation: number; aspectRatio: "4:3" | "16:9";
  trimLeft: number; trimRight: number; trimTop: number; trimBottom: number;
};
export const DEFAULT_CROP: CropState = { cropX: 0, cropY: 0, cropWidth: 100, cropHeight: 100, cropZoom: 1, cropRotation: 0, aspectRatio: "4:3", trimLeft: 0, trimRight: 0, trimTop: 0, trimBottom: 0 };
const MIN_ZOOM = .25, MAX_ZOOM = 4, MIN_VISIBLE = 5;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
type Trim = Pick<CropState, "trimLeft" | "trimRight" | "trimTop" | "trimBottom">;
type TrimEdge = "left" | "right" | "top" | "bottom";

export function ImageCropEditor({ src, preset = "standard", initial = DEFAULT_CROP, allowTrim = true, onApply, onCancel }: { src: string; preset?: "standard" | "wide"; initial?: CropState; allowTrim?: boolean; onApply: (crop: CropState) => void; onCancel: () => void }) {
  const [position, setPosition] = useState({ x: initial.cropX, y: initial.cropY });
  const [zoom, setZoom] = useState(initial.cropZoom);
  const [trim, setTrim] = useState<Trim>({ trimLeft: initial.trimLeft ?? 0, trimRight: initial.trimRight ?? 0, trimTop: initial.trimTop ?? 0, trimBottom: initial.trimBottom ?? 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; cropX: number; cropY: number } | null>(null);
  const trimDrag = useRef<{ pointerId: number; edge: TrimEdge; x: number; y: number; trim: Trim } | null>(null);
  const pendingPosition = useRef(position);
  const animationFrame = useRef<number | null>(null);
  useEffect(() => () => { if (animationFrame.current != null) cancelAnimationFrame(animationFrame.current); }, []);

  const reset = () => { setPosition({ x: 0, y: 0 }); setZoom(1); setTrim({ trimLeft: 0, trimRight: 0, trimTop: 0, trimBottom: 0 }); };
  function startDrag(event: React.PointerEvent<HTMLDivElement>) { if (event.button !== 0 || trimDrag.current) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, cropX: position.x, cropY: position.y }; }
  function startTrim(event: React.PointerEvent<HTMLButtonElement>, edge: TrimEdge) { if (event.button !== 0) return; event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); trimDrag.current = { pointerId: event.pointerId, edge, x: event.clientX, y: event.clientY, trim: { ...trim } }; }
  function moveImage(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = frameRef.current?.getBoundingClientRect(); if (!bounds) return;
    const cropStart = trimDrag.current;
    if (cropStart?.pointerId === event.pointerId) {
      const dx = (event.clientX - cropStart.x) / bounds.width * 100, dy = (event.clientY - cropStart.y) / bounds.height * 100;
      const next = { ...cropStart.trim };
      if (cropStart.edge === "left") next.trimLeft = clamp(cropStart.trim.trimLeft + dx, 0, 100 - cropStart.trim.trimRight - MIN_VISIBLE);
      if (cropStart.edge === "right") next.trimRight = clamp(cropStart.trim.trimRight - dx, 0, 100 - cropStart.trim.trimLeft - MIN_VISIBLE);
      if (cropStart.edge === "top") next.trimTop = clamp(cropStart.trim.trimTop + dy, 0, 100 - cropStart.trim.trimBottom - MIN_VISIBLE);
      if (cropStart.edge === "bottom") next.trimBottom = clamp(cropStart.trim.trimBottom - dy, 0, 100 - cropStart.trim.trimTop - MIN_VISIBLE);
      setTrim(next); return;
    }
    const start = drag.current; if (!start || start.pointerId !== event.pointerId) return;
    pendingPosition.current = { x: clamp(start.cropX + (event.clientX - start.x) / bounds.width * 100, -200, 200), y: clamp(start.cropY + (event.clientY - start.y) / bounds.height * 100, -200, 200) };
    if (animationFrame.current == null) animationFrame.current = requestAnimationFrame(() => { animationFrame.current = null; setPosition(pendingPosition.current); });
  }
  function stopDrag(event: React.PointerEvent<HTMLDivElement>) { if (drag.current?.pointerId === event.pointerId) drag.current = null; if (trimDrag.current?.pointerId === event.pointerId) trimDrag.current = null; }

  const crop: CropState = { cropX: position.x, cropY: position.y, cropWidth: 100, cropHeight: 100, cropZoom: zoom, cropRotation: 0, aspectRatio: preset === "wide" ? "16:9" : "4:3", ...trim };
  const edgeClass = "absolute z-20 block rounded-sm border-2 border-zinc-900 bg-amber-400 shadow-sm";
  const horizontalCenter = trim.trimLeft + (100 - trim.trimLeft - trim.trimRight) / 2;
  const verticalCenter = trim.trimTop + (100 - trim.trimTop - trim.trimBottom) / 2;

  return <div role="dialog" aria-modal="true" aria-label="Crop chart" className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"><div className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl"><header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5"><div><h2 className="font-semibold">Frame chart</h2><p className="text-xs text-muted">{preset === "wide" ? "Wide 16:9" : "Standard 4:3"} final frame. Drag the orange edges to crop, then zoom or move the chart. Empty space stays white.</p></div><button type="button" aria-label="Cancel crop" onClick={onCancel} className="control-square cursor-pointer"><X className="h-4 w-4" /></button></header><div ref={frameRef} className={`relative mx-auto ${preset === "wide" ? "aspect-[16/9] max-w-[calc(65vh*16/9)]" : "aspect-[4/3] max-w-[calc(65vh*4/3)]"} w-full cursor-move touch-none overflow-hidden bg-white`} onDoubleClick={reset} onPointerDown={startDrag} onPointerMove={moveImage} onPointerUp={stopDrag} onPointerCancel={stopDrag}><TradeChartImage image={{ signed_url: src, ...crop }} alt="Chart crop preview" interactive={false} frameAspect={preset === "wide" ? "16:9" : "4:3"} />{allowTrim ? <><div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-white" style={{ height: `${trim.trimTop}%` }} /><div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-white" style={{ height: `${trim.trimBottom}%` }} /><div aria-hidden className="pointer-events-none absolute left-0 z-10 bg-white" style={{ top: `${trim.trimTop}%`, bottom: `${trim.trimBottom}%`, width: `${trim.trimLeft}%` }} /><div aria-hidden className="pointer-events-none absolute right-0 z-10 bg-white" style={{ top: `${trim.trimTop}%`, bottom: `${trim.trimBottom}%`, width: `${trim.trimRight}%` }} /><div aria-hidden className="pointer-events-none absolute z-10 border-2 border-dashed border-amber-400" style={{ inset: `${trim.trimTop}% ${trim.trimRight}% ${trim.trimBottom}% ${trim.trimLeft}%` }} /><button type="button" aria-label="Crop left edge" className={`${edgeClass} h-12 w-3 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize`} style={{ left: `${trim.trimLeft}%`, top: `${verticalCenter}%` }} onPointerDown={(event) => startTrim(event, "left")} /><button type="button" aria-label="Crop right edge" className={`${edgeClass} h-12 w-3 translate-x-1/2 -translate-y-1/2 cursor-ew-resize`} style={{ right: `${trim.trimRight}%`, top: `${verticalCenter}%` }} onPointerDown={(event) => startTrim(event, "right")} /><button type="button" aria-label="Crop top edge" className={`${edgeClass} h-3 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize`} style={{ top: `${trim.trimTop}%`, left: `${horizontalCenter}%` }} onPointerDown={(event) => startTrim(event, "top")} /><button type="button" aria-label="Crop bottom edge" className={`${edgeClass} h-3 w-12 -translate-x-1/2 translate-y-1/2 cursor-ns-resize`} style={{ bottom: `${trim.trimBottom}%`, left: `${horizontalCenter}%` }} onPointerDown={(event) => startTrim(event, "bottom")} /></> : null}<div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25 [&>*]:border-zinc-500/50"><span className="border-b border-r" /><span className="border-b border-r" /><span className="border-b" /><span className="border-b border-r" /><span className="border-b border-r" /><span className="border-b" /><span className="border-r" /><span className="border-r" /><span /></div></div><footer className="flex flex-col gap-4 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - .1))} className="control-square cursor-pointer"><Minus className="h-4 w-4" /></button><input aria-label="Zoom" type="range" min={MIN_ZOOM} max={MAX_ZOOM} step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-40 accent-blue-500 sm:w-52" /><span className="w-12 text-right text-xs tabular-nums text-muted">{Math.round(zoom * 100)}%</span><button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + .1))} className="control-square cursor-pointer"><Plus className="h-4 w-4" /></button></div><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" />Reset</Button><Button type="button" className="border-blue-300/50 bg-blue-500/12 text-blue-700 hover:bg-blue-500/20 dark:text-blue-300" onClick={() => onApply(crop)}>Apply</Button></div></footer></div></div>;
}
