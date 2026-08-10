import Link from "next/link";
import { ArrowUpRight, Images } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { JournalModeBadge } from "@/components/trades/journal-mode";
import { RValue } from "@/components/trades/result";
import { TradeChartImage } from "@/components/trades/trade-chart-image";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade } from "@/types/database";

const labels = { htf_analysis: "HTF Analysis", setup: "Setup", entry: "Entry", management: "Management", exit: "Exit", other: "Chart" } as const;

export function FeedCard({ trade }: { trade: Trade }) {
  const isStudy = trade.journal_mode === "study"; const charts = trade.images.filter((image) => Boolean(image.signed_url)).slice(0, 6);
  const grid = charts.length === 1 ? "max-w-3xl grid-cols-1" : charts.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 2xl:grid-cols-3";
  return <article className="overflow-hidden rounded-lg border border-border bg-surface-raised/75 shadow-sm transition hover:border-primary/35 hover:bg-surface-raised"><div className="p-4 sm:p-5">
    <Link href={`/trades/${trade.id}`} prefetch className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"><header className="flex flex-wrap items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2.5"><strong className="text-base">{trade.instrument.symbol}</strong><JournalModeBadge mode={trade.journal_mode} />{trade.direction ? <Badge className={trade.direction === "long" ? "border-positive/30 bg-positive/8 text-positive" : "border-negative/30 bg-negative/8 text-negative"}>{trade.direction.toUpperCase()}</Badge> : null}{trade.planned_rr != null ? <Badge className="border-primary/30 bg-primary/8 font-mono text-primary">1:{trade.planned_rr}</Badge> : null}<Badge className="border-border bg-control text-secondary">{trade.setup?.name ?? "No model"}</Badge></div>{isStudy ? <span className="text-sm font-semibold text-study">{trade.study_entries.length} entries</span> : trade.realized_r != null ? <RValue value={trade.realized_r} className="text-lg" /> : null}</header><div className="mt-2 flex flex-wrap gap-x-3 text-xs text-secondary"><span>{format(new Date(`${trade.trade_date}T12:00:00`), "d MMM yyyy")}</span>{trade.entry_at ? <span>{format(new Date(trade.entry_at), "HH:mm")}</span> : null}<span>{SESSION_LABELS[trade.session]}</span></div></Link>
    {charts.length ? <div className={`mt-4 grid items-start gap-3 ${grid}`}>{charts.map((image) => <TradeChartImage key={image.id} image={image} alt={`${labels[image.image_type]} chart`} frameAspect={image.capture_preset === "standard" ? "1:1" : "4:3"} />)}</div> : null}
    {trade.notes ? <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{trade.notes}</p> : null}<Link href={`/trades/${trade.id}`} prefetch className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs font-medium text-secondary"><span className="inline-flex items-center gap-1.5"><Images className="h-4 w-4" />{trade.images.length} chart{trade.images.length === 1 ? "" : "s"}</span><span className="inline-flex items-center gap-1 text-primary">Review <ArrowUpRight className="h-3.5 w-3.5" /></span></Link>
  </div></article>;
}
