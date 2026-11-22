import { format, isValid, parseISO } from "date-fns";
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
  const parsedDate = params.date ? parseISO(params.date) : new Date();
  const selectedDate = isValid(parsedDate) ? parsedDate : new Date();
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  query.delete("page");
  const selectedTimeframes = parseTimeframeFilter(params.timeframes);
  const filteredTrades = allTrades.filter(
    (trade) =>
      (!params.instrument || trade.instrument.symbol === params.instrument) &&
      (!params.direction || trade.direction === params.direction) &&
      (!params.session || trade.session === params.session) &&
      (!params.validity || trade.setup_validity === params.validity) &&
      (!params.execution || trade.execution_quality === params.execution) &&
      (!params.status || trade.trade_status === params.status) &&
      matchesResultFilter(trade, params.result) &&
      matchesTimeframeFilter(trade, selectedTimeframes),
  );
  const daySummaries = filteredTrades.filter(
    (trade) => trade.trade_date === dateKey,
  );
  const trades = await getTradesByIds(daySummaries.map((trade) => trade.id));
  const instruments = [
    ...new Set(allTrades.map((trade) => trade.instrument.symbol)),
  ].sort();
  const dayMetrics = calculateMetrics(
    allTrades.filter(
      (trade) => trade.journal_mode === "live" && trade.trade_date === dateKey,
    ),
  );
  const weeklyMetrics = calculateWeeklyOverview(allTrades, dateKey);

  return (
    <>
      <JournalHeader preferences={preferences} />
      <JournalModeView
        initialMode={activeMode}
        dateKey={dateKey}
        selectedDate={format(selectedDate, "yyyy-MM-dd")}
        hasExplicitDate={Boolean(params.date)}
        queryString={query.toString()}
        dayTrades={trades}
        tradeSummaries={filteredTrades}
        dayMetrics={dayMetrics}
        weeklyMetrics={weeklyMetrics}
        instruments={instruments}
      />
    </>
  );
}
