import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import { ArrowDown } from "lucide-react";
import { DayOverview } from "@/components/journal/day-overview";
import { FeedCard } from "@/components/journal/feed-card";
import { FeedControls } from "@/components/journal/feed-controls";
import { FeedFilters } from "@/components/journal/feed-filters";
import { InstrumentTabs } from "@/components/journal/instrument-tabs";
import { JournalHeader } from "@/components/journal/journal-header";
import { PerformancePanels } from "@/components/journal/journal-sidebar";
import {
  getJournalPreferences,
  getSetups,
  getTradeSummaries,
  getTradesByIds,
} from "@/lib/supabase/queries";
import {
  INSTRUMENT_GROUPS,
  isInstrumentGroup,
  type InstrumentGroup,
} from "@/lib/trading/config";
import { matchesResultFilter } from "@/lib/trading/filters";
import { calculateMetrics } from "@/lib/trading/metrics";
import { getPreviousTradingDate } from "@/lib/trading/previous-trading-date";
import type { JournalMode } from "@/types/database";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [allTrades, preferences, setups] = await Promise.all([
    getTradeSummaries(),
    getJournalPreferences(),
    getSetups(true),
  ]);
  const activeMode = (
    ["live", "study", "practice"].includes(params.mode ?? "")
      ? params.mode
      : "all"
  ) as JournalMode | "all";
  const activeInstrument: InstrumentGroup | "all" | null =
    params.allInstruments === "true"
      ? "all"
      : params.instrument && isInstrumentGroup(params.instrument)
        ? params.instrument
        : null;
  const lockedInstrument =
    activeInstrument && activeInstrument !== "all"
      ? activeInstrument
      : undefined;
  const parsedDate = params.date ? parseISO(params.date) : new Date();
  const selectedDate = isValid(parsedDate) ? parsedDate : new Date();
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  query.delete("page");
  const filterGroup =
    lockedInstrument ??
    (params.filterInstrument && isInstrumentGroup(params.filterInstrument)
      ? params.filterInstrument
      : undefined);
  const matchesActiveFilters = (trade: (typeof allTrades)[number]) =>
    (activeMode === "all" || trade.journal_mode === activeMode) &&
    (!filterGroup ||
      (INSTRUMENT_GROUPS[filterGroup] as readonly string[]).includes(
        trade.instrument.symbol,
      )) &&
    (!params.setup ||
      (params.setup === "none"
        ? !trade.setup_id
        : trade.setup_id === params.setup)) &&
    (!params.direction ||
      trade.direction === params.direction ||
      trade.study_entries.some(
        (entry) => entry.direction === params.direction,
      )) &&
    (!params.session ||
      trade.session === params.session ||
      trade.study_entries.some((entry) => entry.session === params.session)) &&
    matchesResultFilter(trade, params.result);
  const filteredTrades = allTrades.filter(matchesActiveFilters);
  const daySummaries = filteredTrades.filter(
    (trade) => trade.trade_date === dateKey,
  );
  const trades = await getTradesByIds(daySummaries.map((trade) => trade.id));
  const previousDate = getPreviousTradingDate(
    filteredTrades.map((trade) => trade.trade_date),
    dateKey,
  );
  const previousQuery = new URLSearchParams(query);
  if (previousDate) previousQuery.set("date", previousDate);
  const dayMetrics = calculateMetrics(
    daySummaries.filter((trade) => trade.journal_mode !== "study"),
  );
  const dayStudies = daySummaries.filter(
    (trade) => trade.journal_mode === "study",
  ).length;

  return (
    <>
      <JournalHeader preferences={preferences} />
      <InstrumentTabs
        active={activeInstrument}
        pinned={preferences.pinnedInstruments}
        query={query}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="min-w-0">
          <FeedFilters active={activeMode} query={query} />
          <p className="mb-3 text-sm text-muted">
            {daySummaries.length} entr{daySummaries.length === 1 ? "y" : "ies"}{" "}
            on {format(selectedDate, "d MMMM yyyy")}.
            {params.date ? (
              <>
                {" "}
                <Link href="/journal" className="text-primary hover:opacity-80">
                  Back to today
                </Link>
              </>
            ) : null}
          </p>
          {trades.length ? (
            <div className="grid gap-4">
              {trades.map((trade) => (
                <FeedCard
                  key={trade.id}
                  trade={trade}
                  timezone={preferences.timezone}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-16 text-center">
              <p className="font-medium">No entries for this day.</p>
              <p className="mt-1 text-sm text-muted">
                Try another filter or continue to the previous trading day.
              </p>
            </div>
          )}
          {previousDate ? (
            <Link
              href={`/journal?${previousQuery}`}
              className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-border bg-surface/60 px-4 py-4 text-sm text-secondary transition hover:border-primary/35 hover:bg-control hover:text-foreground"
            >
              <ArrowDown className="h-4 w-4" />
              View trades from {format(parseISO(previousDate), "d MMMM yyyy")}
            </Link>
          ) : (
            <p className="mt-5 border-t border-border pt-4 text-center text-xs text-muted">
              No earlier trading day matches these filters.
            </p>
          )}
        </main>
        <aside className="grid content-start gap-3 pt-4">
          <DayOverview
            date={dateKey}
            metrics={dayMetrics}
            studies={dayStudies}
            queryString={query.toString()}
          />
          <FeedControls
            query={query}
            lockedInstrument={lockedInstrument}
            setups={setups}
          />
          <PerformancePanels trades={allTrades} activeMode={activeMode} />
        </aside>
      </div>
    </>
  );
}
