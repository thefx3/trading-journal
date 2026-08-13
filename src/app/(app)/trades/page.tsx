import { PageHeader } from "@/components/layout/page-header";
import { TradesExplorer } from "@/components/trades/trades-explorer";
import { getJournalPreferences, getTrades } from "@/lib/supabase/queries";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [filters, trades, preferences] = await Promise.all([
    searchParams,
    getTrades(),
    getJournalPreferences(),
  ]);
  return (
    <>
      <PageHeader
        title="Trades"
        description="Search and review your recorded entries."
      />
      <TradesExplorer
        trades={trades}
        timezone={preferences.timezone}
        initialFilters={filters}
      />
    </>
  );
}
