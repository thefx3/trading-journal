"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowDown } from "lucide-react";
import { DayOverview } from "@/components/journal/day-overview";
import { FeedCard } from "@/components/journal/feed-card";
import { FeedControls } from "@/components/journal/feed-controls";
import { FeedFilters } from "@/components/journal/feed-filters";
import { WeeklyOverview } from "@/components/journal/weekly-overview";
import type {
  PerformanceMetrics,
  WeeklyOverviewMetrics,
} from "@/lib/trading/metrics";
import { getPreviousTradingDate } from "@/lib/trading/previous-trading-date";
import type { JournalMode, Trade } from "@/types/database";

type ActiveMode = JournalMode | "all";
function modeFromLocation(fallback: ActiveMode): ActiveMode {
  const value = new URLSearchParams(window.location.search).get("mode");
  return value === "live" || value === "study" || value === "practice"
    ? value
    : fallback;
}

export function JournalModeView({
  initialMode,
  dateKey,
  selectedDate,
  hasExplicitDate,
  queryString,
  dayTrades,
  tradeSummaries,
  dayMetrics,
  weeklyMetrics,
  instruments,
}: {
  initialMode: ActiveMode;
  dateKey: string;
  selectedDate: string;
  hasExplicitDate: boolean;
  queryString: string;
  dayTrades: Trade[];
  tradeSummaries: Trade[];
  dayMetrics: PerformanceMetrics;
  weeklyMetrics: WeeklyOverviewMetrics;
  instruments: string[];
}) {
  const [activeMode, setActiveMode] = useState(initialMode);
  useEffect(() => {
    const syncMode = () => setActiveMode(modeFromLocation("all"));
    window.addEventListener("popstate", syncMode);
    return () => window.removeEventListener("popstate", syncMode);
  }, []);
  function changeMode(mode: ActiveMode) {
    if (mode === activeMode) return;
    const url = new URL(window.location.href);
    if (mode === "all") url.searchParams.delete("mode");
    else url.searchParams.set("mode", mode);
    url.searchParams.delete("page");
    window.history.pushState(null, "", url);
    setActiveMode(mode);
  }
  const visibleTrades =
    activeMode === "all"
      ? dayTrades
      : dayTrades.filter((trade) => trade.journal_mode === activeMode);
  const visibleSummaries =
    activeMode === "all"
      ? tradeSummaries
      : tradeSummaries.filter((trade) => trade.journal_mode === activeMode);
  const daySummaries = visibleSummaries.filter(
    (trade) => trade.trade_date === dateKey,
  );
  const previousDate = getPreviousTradingDate(
    visibleSummaries.map((trade) => trade.trade_date),
    dateKey,
  );
  const query = new URLSearchParams(queryString);
  if (activeMode === "all") query.delete("mode");
  else query.set("mode", activeMode);
  const previousQuery = new URLSearchParams(query);
  if (previousDate) previousQuery.set("date", previousDate);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <main className="min-w-0">
        <FeedFilters active={activeMode} onChange={changeMode} />
        <p className="mb-3 text-sm text-muted">
          {daySummaries.length} entr{daySummaries.length === 1 ? "y" : "ies"} on{" "}
          {format(parseISO(selectedDate), "d MMMM yyyy")}.
          {hasExplicitDate ? (
            <>
              {" "}
              <Link href="/journal" className="text-primary hover:opacity-80">
                Back to today
              </Link>
            </>
          ) : null}
        </p>
        {visibleTrades.length ? (
          <div className="divide-y divide-border/70 border-y border-border/70">
            {visibleTrades.map((trade) => (
              <FeedCard key={trade.id} trade={trade} />
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
          queryString={query.toString()}
        />
        <WeeklyOverview metrics={weeklyMetrics} />
        <FeedControls
          query={query}
          instruments={instruments}
          activeMode={activeMode}
        />
      </aside>
    </div>
  );
}
