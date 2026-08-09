"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { ImagePlus, SlidersHorizontal, X } from "lucide-react";
import { saveTrade } from "@/app/actions/trades";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { JournalModeSelector } from "./journal-mode";
import { StudyEntriesEditor } from "./study-entries-editor";
import { IMAGE_TYPES, RR_PRESETS, SESSION_LABELS, TIMEFRAMES } from "@/lib/trading/config";
import { getTradingSession, localTradeTimeToUtc } from "@/lib/trading/sessions";
import { cn } from "@/lib/utils";
import { optimizeTradeChart } from "@/lib/images/optimize-trade-chart";
import type { Direction, Instrument, JournalMode, Setup, Trade, TradeResult } from "@/types/database";
import { DEFAULT_CROP, ImageCropEditor, type CropState } from "./image-crop-editor";
import { TradeChartImage } from "./trade-chart-image";

type Chart = { file: File; url: string; imageType: string; timeframe: string; crop: CropState; cropApplied: boolean; originalSize: number; optimized: boolean };
type ExistingCrop = CropState & { id: string; url: string; imageType: string; timeframe: string };
const MAX_CHARTS = 6;
const MAX_CHART_SIZE = 10 * 1024 * 1024;
const CHART_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const SETUP_OPTIONS: readonly (readonly [boolean, string])[] = [[true, "Setup found"], [false, "No valid setup"]];

export function TradeForm({ instruments, setups, defaultSetupId, timezone, trade }: { instruments: Instrument[]; setups: Setup[]; defaultSetupId: string | null; timezone: string; trade?: Trade }) {
  const [state, action, pending] = useActionState(saveTrade, undefined);
  const fileInput = useRef<HTMLInputElement>(null);
  const now = new Date();
  const zonedNow = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now).map((part) => [part.type, part.value]));
  const [mode, setMode] = useState<JournalMode>(trade?.journal_mode ?? "live");
  const [setupId, setSetupId] = useState(trade?.setup_id ?? defaultSetupId ?? "");
  const [setupFound, setSetupFound] = useState(trade?.setup_found ?? true);
  const [instrument, setInstrument] = useState(trade?.instrument.symbol ?? instruments[0]?.symbol ?? "NQ");
  const [date, setDate] = useState(trade?.trade_date ?? `${zonedNow.year}-${zonedNow.month}-${zonedNow.day}`);
  const [time, setTime] = useState(trade?.entry_at ? new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(trade.entry_at)) : mode === "study" ? "" : `${zonedNow.hour}:${zonedNow.minute}`);
  const [direction, setDirection] = useState<Direction | null>(trade?.direction ?? "long");
  const [rr, setRr] = useState<number | null>(trade?.planned_rr ?? 2);
  const [result, setResult] = useState<TradeResult | null>(trade?.result ?? "win");
  const [realized, setRealized] = useState<number | null>(trade?.realized_r ?? 2);
  const [sessionOverride, setSessionOverride] = useState(trade?.session_override ?? false);
  const detectedSession = useMemo(() => time ? getTradingSession(instrument, localTradeTimeToUtc(date, time, timezone)) : "other", [instrument, date, time, timezone]);
  const [manualSession, setManualSession] = useState(trade?.session ?? detectedSession);
  const session = sessionOverride ? manualSession : detectedSession;
  const [charts, setChartsState] = useState<Chart[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [existingCrops, setExistingCrops] = useState<ExistingCrop[]>(() => (trade?.images ?? []).filter((image) => image.signed_url).map((image) => ({ id: image.id, url: image.signed_url!, imageType: image.image_type, timeframe: image.timeframe, cropX: Number(image.crop_x ?? 0), cropY: Number(image.crop_y ?? 0), cropWidth: Number(image.crop_width ?? 100), cropHeight: Number(image.crop_height ?? 100), cropZoom: Number(image.crop_zoom ?? 1), cropRotation: Number(image.crop_rotation ?? 0), aspectRatio: "4:3" })));
  const [cropTarget, setCropTarget] = useState<{ kind: "new" | "existing"; index: number } | null>(null);
  const isStudy = mode === "study";
  const showExecution = !isStudy;
  const selectedInstrument = instruments.find((item) => item.symbol === instrument);

  function setCharts(next: Chart[]) {
    setChartsState(next);
    const transfer = new DataTransfer();
    next.forEach((chart) => transfer.items.add(chart.file));
    if (fileInput.current) fileInput.current.files = transfer.files;
  }

  async function addFiles(files: FileList | null) {
    if (!files || optimizing) return;
    const available = Math.max(0, MAX_CHARTS - (trade?.images.length ?? 0) - charts.length);
    const selected = Array.from(files).slice(0, available); if (!selected.length) return;
    if (selected.some((file) => !CHART_TYPES.has(file.type) || file.size > MAX_CHART_SIZE)) { setUploadError("Charts must be PNG, JPEG or WebP and no larger than 10 MB."); if (fileInput.current) fileInput.current.value = ""; return; }
    setOptimizing(true); setUploadError(null); if (fileInput.current) fileInput.current.value = "";
    try { const additions: Chart[] = []; for (const source of selected) { const result = await optimizeTradeChart(source); additions.push({ file: result.file, url: URL.createObjectURL(result.file), imageType: "setup", timeframe: "5m", crop: DEFAULT_CROP, cropApplied: false, originalSize: result.originalSize, optimized: result.optimized }); } const firstIndex = charts.length; setCharts([...charts, ...additions]); setCropTarget({ kind: "new", index: firstIndex }); }
    catch { setUploadError("This chart could not be optimized. Please try another PNG, JPEG or WebP file."); }
    finally { setOptimizing(false); }
  }

  function removeChart(index: number) {
    URL.revokeObjectURL(charts[index].url);
    setCharts(charts.filter((_, itemIndex) => itemIndex !== index));
  }

  function changeMode(nextMode: JournalMode) {
    setMode(nextMode);
    if (nextMode !== "study") { setSetupFound(true); if (!time) setTime(`${zonedNow.hour}:${zonedNow.minute}`); if (!direction) setDirection("long"); if (rr == null) setRr(2); if (!result) setResult("win"); if (realized == null) setRealized(2); }
  }

  function changeResult(nextResult: TradeResult) { setResult(nextResult); setRealized(nextResult === "win" ? rr ?? 0 : nextResult === "loss" ? -1 : 0); }
  function chooseSetup(found: boolean) { setSetupFound(found); if (!found) { setDirection(null); setRr(null); setResult(null); setRealized(null); setTime(""); } }

  const cropItem = cropTarget?.kind === "new" ? charts[cropTarget.index] ? { src: charts[cropTarget.index].url, crop: charts[cropTarget.index].crop } : null : cropTarget ? existingCrops[cropTarget.index] ? { src: existingCrops[cropTarget.index].url, crop: existingCrops[cropTarget.index] } : null : null;
  function applyCrop(crop: CropState) { if (!cropTarget) return; if (cropTarget.kind === "new") { const next = charts.map((item, index) => index === cropTarget.index ? { ...item, crop, cropApplied: true } : item); setCharts(next); const nextUncropped = next.findIndex((item, index) => index > cropTarget.index && !item.cropApplied); setCropTarget(nextUncropped >= 0 ? { kind: "new", index: nextUncropped } : null); } else { setExistingCrops((items) => items.map((item, index) => index === cropTarget.index ? { ...item, ...crop } : item)); setCropTarget(null); } }

  return <><div className="mb-5 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]"><div className="setup-field rounded-lg border border-border bg-surface p-5 xl:col-start-2"><Field label="SETUP"><Select form="trade-form" name="setupId" value={setupId} onChange={(event) => setSetupId(event.target.value)}><option value="">No model</option>{setups.map((setup) => <option key={setup.id} value={setup.id}>{setup.name}{setup.archived_at ? " (archived)" : ""}</option>)}</Select></Field></div></div><form id="trade-form" data-mode={mode} action={action} noValidate onChange={(event) => { const target = event.target; if (target instanceof HTMLInputElement && target.name === "realizedR") { const value = target.value === "" ? null : Number(target.value); setResult(value == null ? null : value > 0 ? "win" : value < 0 ? "loss" : "be"); } }} className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
    <input type="hidden" name="tradeId" value={trade?.id ?? ""} /><input type="hidden" name="originalSetupId" value={trade?.setup_id ?? ""} /><input type="hidden" name="journalMode" value={mode} /><input type="hidden" name="setupFound" value={String(setupFound)} /><input type="hidden" name="instrumentId" value={selectedInstrument?.id ?? ""} /><input type="hidden" name="instrumentSymbol" value={instrument} /><input type="hidden" name="timezone" value={timezone} /><input type="hidden" name="direction" value={direction ?? ""} /><input type="hidden" name="sessionOverride" value={String(sessionOverride)} /><input type="hidden" name="existingImageCount" value={trade?.images.length ?? 0} /><input type="hidden" name="imageMeta" value={JSON.stringify(charts.map(({ imageType, timeframe, crop }) => ({ imageType, timeframe, ...crop })))} /><input type="hidden" name="existingImageMeta" value={JSON.stringify(existingCrops.map(({ id, cropX, cropY, cropWidth, cropHeight, cropZoom, cropRotation, aspectRatio }) => ({ id, cropX, cropY, cropWidth, cropHeight, cropZoom, cropRotation, aspectRatio })))} />
    <section><div className="mb-4"><h2 className="text-sm font-semibold uppercase tracking-wider">Charts</h2><p className="mt-1 text-sm text-zinc-600">Add up to 6 PNG, JPEG or WebP charts.</p></div><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 text-zinc-500 transition hover:border-blue-900 hover:text-blue-300"><ImagePlus className="mb-3 h-6 w-6" /><span className="text-sm font-medium">Upload charts</span><span className="mt-1 text-xs">10 MB maximum each</span><input ref={fileInput} className="sr-only" type="file" name="charts" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => addFiles(event.target.files)} /></label>{existingCrops.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{existingCrops.map((chart, index) => <div key={chart.id} className="overflow-hidden rounded-lg border border-border bg-surface"><TradeChartImage image={{ signed_url: chart.url, ...chart }} alt={`Existing chart ${index + 1}`} interactive={false} /><div className="flex items-center justify-between p-3 text-sm"><span>{IMAGE_TYPES.find((type) => type.value === chart.imageType)?.label} · {chart.timeframe}</span><Button type="button" size="sm" variant="outline" onClick={() => setCropTarget({ kind: "existing", index })}><SlidersHorizontal className="h-4 w-4" />Adjust</Button></div></div>)}</div> : null}<div className="mt-4 grid gap-4 sm:grid-cols-2">{charts.map((chart, index) => <div key={chart.url} className="overflow-hidden rounded-lg border border-border bg-surface"><div className="relative"><TradeChartImage image={{ signed_url: chart.url, ...chart.crop }} alt={`Chart ${index + 1}`} interactive={false} /><button type="button" aria-label={`Remove chart ${index + 1}`} onClick={() => removeChart(index)} className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center"><X className="h-4 w-4" /></button></div><div className="grid grid-cols-[1fr_1fr_auto] gap-2 p-3"><Select value={chart.imageType} onChange={(event) => setCharts(charts.map((item, itemIndex) => itemIndex === index ? { ...item, imageType: event.target.value } : item))}>{IMAGE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</Select><Select value={chart.timeframe} onChange={(event) => setCharts(charts.map((item, itemIndex) => itemIndex === index ? { ...item, timeframe: event.target.value } : item))}>{TIMEFRAMES.map((timeframe) => <option key={timeframe}>{timeframe}</option>)}</Select><button type="button" aria-label={`Adjust chart ${index + 1}`} onClick={() => setCropTarget({ kind: "new", index })} className="control-square cursor-pointer"><SlidersHorizontal className="h-4 w-4" /></button></div></div>)}</div></section>
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 sm:p-6"><JournalModeSelector value={mode} onChange={changeMode} />{isStudy ? <div className="mt-6"><span className="mb-2 block text-sm font-medium text-zinc-300">Study outcome</span><div className="grid grid-cols-2 gap-2">{SETUP_OPTIONS.map(([found, label]) => <button key={label} type="button" onClick={() => chooseSetup(found)} className={cn("h-10 rounded-md border text-sm", setupFound === found ? "border-purple-800 bg-purple-950/30 text-purple-300" : "border-zinc-800 text-zinc-600")}>{label}</button>)}</div></div> : null}<h2 className="mb-6 mt-7 text-sm font-semibold uppercase tracking-wider">{isStudy ? "Analysis details" : "Trade details"}</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Field label="Instrument"><Select value={instrument} onChange={(event) => setInstrument(event.target.value)}>{instruments.map((item) => <option key={item.id} value={item.symbol}>{item.symbol}</option>)}</Select></Field><Field label={mode === "live" ? "Date" : "Historical market date"}><Input name="tradeDate" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></Field>{showExecution ? <Field label={isStudy ? "Potential entry time" : "Entry time"} hint={isStudy ? "Optional" : timezone}><Input name="entryTime" type="time" value={time} onChange={(event) => setTime(event.target.value)} required={!isStudy} /></Field> : <input type="hidden" name="entryTime" value="" />}<Field label="Session" hint={sessionOverride ? "Manual" : "Auto-detected"}><Select name="session" value={session} onChange={(event) => { setManualSession(event.target.value as typeof manualSession); setSessionOverride(true); }}>{Object.entries(SESSION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field></div>
    {showExecution ? <><div className="mt-5"><span className="mb-2 block text-sm font-medium text-zinc-300">{isStudy ? "Potential direction" : "Direction"}</span><div className="grid grid-cols-2 gap-2">{(["long", "short"] as const).map((value) => <button type="button" key={value} onClick={() => setDirection(value)} className={cn("h-10 rounded-md border text-sm font-semibold uppercase", direction === value ? value === "long" ? "border-emerald-700 bg-emerald-950/50 text-emerald-300" : "border-red-800 bg-red-950/40 text-red-300" : "border-zinc-800 text-zinc-600")}>{value}</button>)}</div></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label={isStudy ? "Potential RR" : "Risk / Reward"}><Select name="plannedRr" value={rr ?? ""} onChange={(event) => setRr(event.target.value ? Number(event.target.value) : null)} required={!isStudy}>{isStudy ? <option value="">Not specified</option> : null}{RR_PRESETS.map((value) => <option key={value} value={value}>1:{value}</option>)}</Select></Field>{!isStudy ? <><Field label="Result"><Select name="result" value={result ?? ""} onChange={(event) => changeResult(event.target.value as TradeResult)}><option value="win">Win</option><option value="loss">Loss</option><option value="be">Break even</option><option value="open">Open</option></Select></Field><Field label="Realized R" hint="Editable"><Input name="realizedR" type="number" step="0.1" value={realized ?? ""} onChange={(event) => setRealized(event.target.value ? Number(event.target.value) : null)} /></Field></> : <><input type="hidden" name="result" value="" /><input type="hidden" name="realizedR" value="" /></>}</div></> : <><input type="hidden" name="plannedRr" value="" /><input type="hidden" name="result" value="" /><input type="hidden" name="realizedR" value="" /></>}
    {isStudy ? <StudyEntriesEditor formId="trade-form" instrument={instrument} date={date} timezone={timezone} initialEntries={trade?.study_entries ?? []} /> : null}<div className="mt-5"><Field label="Notes"><Textarea name="notes" defaultValue={trade?.notes ?? ""} placeholder={isStudy ? "What did the historical price action teach you?" : "Liquidity sweep → MSS → FVG…"} /></Field></div>{state?.error || uploadError ? <p role="alert" className="form-error mt-5 rounded-lg p-3.5 text-sm font-medium">{state?.error ?? uploadError}</p> : null}<div className="mt-6 flex justify-end"><Button type="submit" size="lg" disabled={pending || optimizing} className="focus-visible:ring-blue-700">{optimizing ? "Optimizing charts…" : pending ? "Saving…" : trade ? "Save changes" : `Save ${mode}`}</Button></div></section>
  </form>{cropItem ? <ImageCropEditor src={cropItem.src} initial={cropItem.crop} onApply={applyCrop} onCancel={() => setCropTarget(null)} /> : null}</>;
}
