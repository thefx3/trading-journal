import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteTrade, deleteTradeImage } from "@/app/actions/trades";
import { PageHeader } from "@/components/layout/page-header";
import { JournalModeBadge } from "@/components/trades/journal-mode";
import { RValue } from "@/components/trades/result";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { SESSION_LABELS } from "@/lib/trading/config";
import { getJournalPreferences, getTrade } from "@/lib/supabase/queries";
import type { StudyEntry } from "@/types/database";

function Detail({ label, children }: { label: string; children: React.ReactNode }) { return <div className="min-w-20"><span className="block text-xs text-muted">{label}</span><strong className="mt-1 block text-sm font-medium text-foreground">{children}</strong></div>; }
function timeInZone(value: string, timezone: string) { return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value)); }
function PotentialEntry({ entry, index, timezone }: { entry: StudyEntry; index: number; timezone: string }) { return <Panel className="p-3"><div className="flex items-center justify-between"><strong className="text-sm">Entry {index + 1}</strong><RValue value={Number(entry.realized_r)} /></div><p className="mt-2 text-sm text-secondary">{timeInZone(entry.entry_at, timezone)} · {SESSION_LABELS[entry.session]}</p><p className="mt-1 text-xs text-muted">{entry.direction.toUpperCase()} · 1:{Number(entry.planned_rr)} · {entry.result}</p></Panel>; }

export default async function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trade, preferences] = await Promise.all([getTrade(id), getJournalPreferences()]);
  if (!trade) notFound();
  const isStudy = trade.journal_mode === "study";
  const titleDate = format(new Date(`${trade.trade_date}T12:00:00`), "d MMMM yyyy");
  const entryLabel = trade.entry_at ? timeInZone(trade.entry_at, preferences.timezone) : "Study";
  return <><PageHeader title={titleDate} description={`${entryLabel} · ${isStudy ? "Historical study" : SESSION_LABELS[trade.session]}`} backHref="/journal" /><Panel className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-4 p-5"><strong className="text-base">{trade.instrument.symbol}</strong><JournalModeBadge mode={trade.journal_mode} />{trade.direction ? <span className={trade.direction === "long" ? "font-semibold text-positive" : "font-semibold text-negative"}>{trade.direction.toUpperCase()}</span> : null}<Detail label="Setup">{trade.setup?.name ?? "No model"}</Detail>{isStudy ? <><Detail label="Potential entries">{trade.study_entries.length}</Detail><Detail label="Study result">{trade.setup_found ? "Setup found" : "No valid setup"}</Detail></> : <><Detail label="Planned RR">1:{Number(trade.planned_rr)}</Detail><Detail label="Result"><span className={trade.result === "win" ? "text-positive" : trade.result === "loss" ? "text-negative" : "text-muted"}>{trade.result === "be" ? "BE" : trade.result?.toUpperCase()}</span></Detail><Detail label="Realized">{trade.realized_r != null ? <RValue value={Number(trade.realized_r)} /> : "—"}</Detail><Detail label="Session">{SESSION_LABELS[trade.session]}</Detail></>}<div className="ml-auto flex gap-2"><Button asChild variant="outline"><Link href={`/trades/${id}/edit`}>Edit</Link></Button><form action={deleteTrade}><input type="hidden" name="id" value={id} /><Button variant="destructive">Delete</Button></form></div></Panel><div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]"><section>{trade.images.length ? <div className="grid gap-7">{trade.images.map((image) => <figure key={image.id}><figcaption className="chart-caption mb-2 flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold"><span>{trade.setup?.name ?? "No model"} <span className="text-white/55">|</span> {image.timeframe}</span><form action={deleteTradeImage}><input type="hidden" name="imageId" value={image.id} /><input type="hidden" name="tradeId" value={id} /><button aria-label="Delete chart" className="grid h-7 w-7 cursor-pointer place-items-center rounded text-white/70 transition hover:bg-white/10 hover:text-white"><Trash2 className="h-4 w-4" /></button></form></figcaption>{image.signed_url ? <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-black"><Image src={image.signed_url} alt="Trade chart" fill sizes="(max-width: 1280px) 100vw, 70vw" className="object-contain" /></div> : null}</figure>)}</div> : <div className="rounded-lg border border-dashed border-border py-20 text-center text-sm text-muted">No charts attached.</div>}</section><aside className="grid content-start gap-6">{isStudy && trade.study_entries.length ? <section><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-study">Potential entries</h2><div className="grid gap-2">{trade.study_entries.map((entry, index) => <PotentialEntry key={entry.id} entry={entry} index={index} timezone={preferences.timezone} />)}</div></section> : null}{trade.notes ? <section><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">Notes</h2><p className="whitespace-pre-wrap text-sm leading-6 text-muted">{trade.notes}</p></section> : null}</aside></div></>;
}
