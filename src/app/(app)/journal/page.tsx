import { addDays, format, isValid, parseISO, startOfWeek } from "date-fns";
import { JournalHeader } from "@/components/journal/journal-header";
import { JournalModeView } from "@/components/journal/journal-mode-view";
import {
  getJournalPreferences,
  getTradeSummaries,
  getTradesByIds,
} from "@/lib/supabase/queries";
import {
  matchesResultFilter,
  matchesTimeframeFilter,
  parseTimeframeFilter,
} from "@/lib/trading/filters";
import {
  calculateMetrics,
  calculateWeeklyOverview,
} from "@/lib/trading/metrics";
import type { JournalMode } from "@/types/database";

function currentDateIn(timezone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [allTrades, preferences] = await Promise.all([
    getTradeSummaries(),
    getJournalPreferences(),
  ]);
  const activeMode = (
    ["live", "study", "practice"].includes(params.mode ?? "")
      ? params.mode
      : "all"
  ) as JournalMode | "all";
  const todayKey = currentDateIn(preferences.timezone);
  const parsedDate = parseISO(params.date ?? todayKey);
  const selectedDate = isValid(parsedDate) ? parsedDate : parseISO(todayKey);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    format(addDays(weekStart, index), "yyyy-MM-dd"),
  );
  const weekStartKey = weekDays[0]!;
  const weekEndKey = weekDays[6]!;
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  query.delete("page");
  query.delete("status");
  const selectedTimeframes = parseTimeframeFilter(params.timeframes);
  const filteredTrades = allTrades.filter(
    (trade) =>
      (!params.instrument || trade.instrument.symbol === params.instrument) &&
      (!params.direction || trade.direction === params.direction) &&
      (!params.session || trade.session === params.session) &&
      (!params.validity || trade.setup_validity === params.validity) &&
      (!params.execution || trade.execution_quality === params.execution) &&
      matchesResultFilter(trade, params.result) &&
      matchesTimeframeFilter(trade, selectedTimeframes),
  );
  const weekSummaries = filteredTrades.filter(
    (trade) =>
      trade.trade_date >= weekStartKey && trade.trade_date <= weekEndKey,
  );
  const weekTrades = await getTradesByIds(
    weekSummaries.map((trade) => trade.id),
  );
  const instruments = [
    ...new Set(allTrades.map((trade) => trade.instrument.symbol)),
  ].sort();
  const dayMetricsByDate = Object.fromEntries(
    weekDays.map((day) => [
      day,
      calculateMetrics(
        allTrades.filter(
          (trade) => trade.journal_mode === "live" && trade.trade_date === day,
        ),
      ),
    ]),
  );
  const weeklyCutoff =
    todayKey >= weekStartKey && todayKey <= weekEndKey
      ? todayKey
      : weekEndKey < todayKey
        ? weekEndKey
        : weekStartKey;
  const weeklyMetrics = calculateWeeklyOverview(allTrades, weeklyCutoff);

  return (
    <>
      <JournalHeader preferences={preferences} />
      <JournalModeView
        key={format(selectedDate, "yyyy-MM-dd")}
        initialMode={activeMode}
        selectedDate={format(selectedDate, "yyyy-MM-dd")}
        hasExplicitDate={Boolean(params.date)}
        queryString={query.toString()}
        weekDays={weekDays}
        weekTrades={weekTrades}
        dayMetricsByDate={dayMetricsByDate}
        weeklyMetrics={weeklyMetrics}
        instruments={instruments}
        todayKey={todayKey}
      />
    </>
  );
}
