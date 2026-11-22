"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { DayOverview } from "@/components/journal/day-overview";
import { FeedControls } from "@/components/journal/feed-controls";
import { FeedFilters } from "@/components/journal/feed-filters";
import { WeeklyFeed } from "@/components/journal/weekly-feed";
import { WeeklyOverview } from "@/components/journal/weekly-overview";
import type {
  PerformanceMetrics,
  WeeklyOverviewMetrics,
} from "@/lib/trading/metrics";
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
  selectedDate,
  hasExplicitDate,
  queryString,
  weekDays,
  weekTrades,
  dayMetricsByDate,
  weeklyMetrics,
  instruments,
  todayKey,
}: {
  initialMode: ActiveMode;
  selectedDate: string;
  hasExplicitDate: boolean;
  queryString: string;
  weekDays: string[];
  weekTrades: Trade[];
  dayMetricsByDate: Record<string, PerformanceMetrics>;
  weeklyMetrics: WeeklyOverviewMetrics;
  instruments: string[];
  todayKey: string;
}) {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [activeDate, setActiveDate] = useState(selectedDate);

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

  const visibleTrades = useMemo(
    () =>
      activeMode === "all"
        ? weekTrades
        : weekTrades.filter((trade) => trade.journal_mode === activeMode),
    [activeMode, weekTrades],
  );
  const updateActiveDate = useCallback((date: string) => {
    setActiveDate((current) => (current === date ? current : date));
  }, []);
  const query = new URLSearchParams(queryString);
  if (activeMode === "all") query.delete("mode");
  else query.set("mode", activeMode);
  const resolvedQuery = query.toString();
  const firstDay = weekDays[0] ?? selectedDate;
  const lastDay = weekDays[6] ?? selectedDate;
  const dayMetrics = dayMetricsByDate[activeDate] ?? dayMetricsByDate[firstDay];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <main className="min-w-0">
        <FeedFilters active={activeMode} onChange={changeMode} />
        <p className="mb-2 text-sm text-muted">
          {visibleTrades.length} entr{visibleTrades.length === 1 ? "y" : "ies"}
          <span className="mx-2 text-border">·</span>
          {format(parseISO(firstDay), "d MMM")} —{" "}
          {format(parseISO(lastDay), "d MMM yyyy")}
          {hasExplicitDate ? (
            <>
              <span className="mx-2 text-border">·</span>
              <Link href="/journal" className="text-primary hover:opacity-80">
                Current week
              </Link>
            </>
          ) : null}
        </p>
        <WeeklyFeed
          days={weekDays}
          trades={visibleTrades}
          selectedDate={selectedDate}
          activeDate={activeDate}
          todayKey={todayKey}
          queryString={resolvedQuery}
          onActiveDateChange={updateActiveDate}
        />
      </main>
      <aside className="pt-4 xl:sticky xl:top-4 xl:self-start">
        <div className="grid content-start gap-3 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1">
          {dayMetrics ? (
            <DayOverview
              key={activeDate}
              date={activeDate}
              metrics={dayMetrics}
              queryString={resolvedQuery}
            />
          ) : null}
          <WeeklyOverview metrics={weeklyMetrics} />
          <FeedControls
            query={query}
            instruments={instruments}
            activeMode={activeMode}
          />
        </div>
      </aside>
    </div>
  );
}
