import { PageHeader } from "@/components/layout/page-header";
import { TradeForm } from "@/components/trades/trade-form";
import { getInstruments, getJournalPreferences } from "@/lib/supabase/queries";
export default async function NewTradePage() {
  const [instruments, preferences] = await Promise.all([
    getInstruments(),
    getJournalPreferences(),
  ]);
  return (
    <>
      <PageHeader
        title="Add a trade"
        description="Capture the charts, then record the occurrence."
        showAddTrade={false}
        preferences={preferences}
      />
      <TradeForm instruments={instruments} timezone={preferences.timezone} />
    </>
  );
}
