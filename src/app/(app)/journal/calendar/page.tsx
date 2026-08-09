import Link from "next/link";
import { endOfMonth, format, isValid, parse, startOfMonth } from "date-fns";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { TradeCalendar } from "@/components/calendar/trade-calendar";
import { MonthlyStats } from "@/components/calendar/monthly-stats";
import { PageHeader } from "@/components/layout/page-header";
import { getTradeSummaries } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import type { JournalMode } from "@/types/database";

const MODES = ["all", "live", "study", "replay"] as const;
const MODE_STYLES: Record<(typeof MODES)[number], string> = {
  all: "border-primary/45 bg-primary/10 text-primary",
  live: "border-live/45 bg-live/10 text-live",
  study: "border-study/45 bg-study/10 text-study",
  replay: "border-replay/45 bg-replay/10 text-replay",
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ mode?: string; month?: string }> }) {
  const params = await searchParams;
  const parsed = params.month ? parse(params.month, "yyyy-MM", new Date()) : new Date();
  const month = isValid(parsed) ? parsed : new Date();
  const active = (["live", "study", "replay"].includes(params.mode ?? "") ? params.mode : "all") as JournalMode | "all";
  const allTrades = await getTradeSummaries();
  const monthTrades = allTrades.filter((trade) => trade.trade_date >= format(startOfMonth(month), "yyyy-MM-dd") && trade.trade_date <= format(endOfMonth(month), "yyyy-MM-dd"));
  const visible = active === "all" ? monthTrades : monthTrades.filter((trade) => trade.journal_mode === active);
  const modeHref = (mode: string) => `/journal/calendar?month=${format(month, "yyyy-MM")}${mode === "all" ? "" : `&mode=${mode}`}`;
  return <><PageHeader title="Calendar" description="Monthly overview" /><MonthlyStats trades={monthTrades} /><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><nav aria-label="Calendar mode" className="inline-flex rounded-lg border border-border bg-surface p-1">{MODES.map((mode) => <Link key={mode} href={modeHref(mode)} prefetch className={cn("rounded-md px-3.5 py-2 text-sm capitalize text-muted transition hover:text-foreground", active === mode && [MODE_STYLES[mode], "font-semibold"])}>{mode}</Link>)}</nav><CalendarControls month={format(month, "yyyy-MM")} mode={active} /></div><TradeCalendar trades={visible} month={month} /></>;
}
