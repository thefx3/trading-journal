import { format, isValid, parseISO } from "date-fns";
import { InstrumentTabs } from "@/components/journal/instrument-tabs";
import { JournalHeader } from "@/components/journal/journal-header";
import { JournalModeView } from "@/components/journal/journal-mode-view";
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
import { matchesResultFilter, matchesTimeframeFilter, parseTimeframeFilter } from "@/lib/trading/filters";
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
  const selectedTimeframes = parseTimeframeFilter(params.timeframes);
  const matchesActiveFilters = (trade: (typeof allTrades)[number]) =>
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
    (!params.validity || trade.setup_validity === params.validity) &&
    (!params.execution || trade.execution_quality === params.execution) &&
    (!params.status || trade.trade_status === params.status) &&
    matchesResultFilter(trade, params.result) &&
    matchesTimeframeFilter(trade, selectedTimeframes);
  const filteredTrades = allTrades.filter(matchesActiveFilters);
  const daySummaries = filteredTrades.filter(
    (trade) => trade.trade_date === dateKey,
  );
  const trades = await getTradesByIds(daySummaries.map((trade) => trade.id));

  return (
    <>
      <JournalHeader preferences={preferences} />
      <InstrumentTabs
        active={activeInstrument}
        pinned={preferences.pinnedInstruments}
        query={query}
      />
      <JournalModeView
        initialMode={activeMode}
        dateKey={dateKey}
        selectedDate={format(selectedDate, "yyyy-MM-dd")}
        hasExplicitDate={Boolean(params.date)}
        queryString={query.toString()}
        dayTrades={trades}
        tradeSummaries={filteredTrades}
        timezone={preferences.timezone}
        lockedInstrument={lockedInstrument}
        setups={setups}
      />
    </>
  );
}
