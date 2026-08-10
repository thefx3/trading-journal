import { PageHeader } from "@/components/layout/page-header";
import { TradeDateFilter } from "@/components/trades/trade-date-filter";
import { TradeList } from "@/components/trades/trade-list";
import { Button } from "@/components/ui/button";
import { getJournalPreferences, getTrades } from "@/lib/supabase/queries";

export default async function TradesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams; const [allTrades, preferences] = await Promise.all([getTrades(), getJournalPreferences()]); let trades = allTrades;
  if (filters.mode) trades = trades.filter((trade) => trade.journal_mode === filters.mode);
  if (filters.instrument) trades = trades.filter((trade) => trade.instrument.symbol === filters.instrument);
  if (filters.direction) trades = trades.filter((trade) => trade.direction === filters.direction);
  if (filters.result) trades = trades.filter((trade) => trade.result === filters.result);
  if (filters.session) trades = trades.filter((trade) => trade.session === filters.session);
  if (filters.dateValue) { const expectedLength = filters.dateRange === "year" ? 4 : filters.dateRange === "month" ? 7 : 10; if (filters.dateValue.length === expectedLength) trades = trades.filter((trade) => filters.dateRange === "day" ? trade.trade_date === filters.dateValue : trade.trade_date.startsWith(filters.dateValue!)); }
  const instruments = [...new Set(allTrades.map((trade) => trade.instrument.symbol))];
  const filterOptions = [["mode", "Mode", ["live", "study", "practice"]], ["instrument", "Instrument", instruments], ["direction", "Direction", ["long", "short"]], ["result", "Result", ["win", "loss", "be"]], ["session", "Session", ["asia", "london", "new_york_am", "new_york_lunch", "new_york_pm", "other"]]] as const;
  return <><PageHeader title="Trades" description={`${trades.length} recorded entr${trades.length === 1 ? "y" : "ies"}`} /><form className="mb-5 grid gap-3"><div className="flex flex-wrap gap-2">{filterOptions.map(([name, label, options]) => <select key={name} name={name} defaultValue={filters[name] ?? ""} className="control px-3 text-sm text-muted"><option value="">{label}: All</option>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>)}</div><div className="flex flex-wrap items-center justify-between gap-3"><TradeDateFilter initialRange={filters.dateRange} initialValue={filters.dateValue} /><Button variant="outline" className="cursor-pointer border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">Apply</Button></div></form><TradeList trades={trades} timezone={preferences.timezone} /></>;
}
