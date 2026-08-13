import { format, parseISO } from "date-fns";
import { notFound } from "next/navigation";
import {
  ModeComparisonColumn,
  type ComparisonMode,
} from "@/components/journal/mode-comparison";
import { PageHeader } from "@/components/layout/page-header";
import { getJournalPreferences, getTrades } from "@/lib/supabase/queries";

const MODES: ComparisonMode[] = ["live", "study", "practice"];
function comparisonMode(
  value: string | undefined,
  fallback: ComparisonMode,
): ComparisonMode {
  return MODES.includes(value as ComparisonMode)
    ? (value as ComparisonMode)
    : fallback;
}

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ left?: string; right?: string }>;
}) {
  const [{ date }, query] = await Promise.all([params, searchParams]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const left = comparisonMode(query.left, "live");
  const requestedRight = comparisonMode(query.right, "study");
  const right =
    requestedRight === left
      ? MODES.find((mode) => mode !== left)!
      : requestedRight;
  const [allTrades, preferences] = await Promise.all([
    getTrades(),
    getJournalPreferences(),
  ]);
  const trades = allTrades.filter((trade) => trade.trade_date === date);
  return (
    <>
      <PageHeader
        title={format(parseISO(date), "d MMMM yyyy")}
        description="Compare your execution with your reconstructed market read."
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <ModeComparisonColumn
          side="left"
          mode={left}
          otherMode={right}
          date={date}
          trades={trades}
          timezone={preferences.timezone}
        />
        <ModeComparisonColumn
          side="right"
          mode={right}
          otherMode={left}
          date={date}
          trades={trades}
          timezone={preferences.timezone}
        />
      </div>
    </>
  );
}
