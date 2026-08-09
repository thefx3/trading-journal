import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { RValue } from "@/components/trades/result";
import { TradeChartImage } from "@/components/trades/trade-chart-image";
import { SESSION_LABELS } from "@/lib/trading/config";
import type { Trade } from "@/types/database";

export function StudyEntryList({ trades }: { trades: Trade[] }) {
  const rows = trades.flatMap((trade) => trade.study_entries.map((entry) => ({ trade, entry })));
  if (!rows.length) return <div className="rounded-lg border border-dashed border-border py-12 text-center"><p className="font-medium">No potential entries.</p><p className="mt-1 text-sm text-muted">This Study may intentionally conclude that no valid setup existed.</p></div>;
  return <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">{rows.map(({ trade, entry }, index) => <Link key={entry.id} href={`/trades/${trade.id}`} prefetch className="grid grid-cols-[auto_1fr_auto] items-center gap-3 bg-surface/40 p-3 transition hover:bg-control/60">{trade.images[0]?.signed_url ? <span className="block w-16 overflow-hidden rounded border border-border"><TradeChartImage image={trade.images[0]} alt="Study chart" interactive={false} /></span> : <span className="grid aspect-[4/3] w-16 place-items-center rounded bg-control text-xs text-subtle">#{index + 1}</span>}<div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{trade.instrument.symbol}</strong><Badge className={entry.direction === "long" ? "text-positive" : "text-negative"}>{entry.direction.toUpperCase()}</Badge><Badge className="border-primary/30 bg-primary/10 font-mono text-primary">1:{Number(entry.planned_rr)}</Badge></div><p className="mt-1 truncate text-xs text-muted">{format(new Date(entry.entry_at), "HH:mm")} · {SESSION_LABELS[entry.session]} · {entry.result === "be" ? "Break even" : entry.result}</p></div><RValue value={Number(entry.realized_r)} className="text-right" /></Link>)}</div>;
}
