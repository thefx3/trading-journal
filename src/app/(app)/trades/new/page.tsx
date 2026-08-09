import { PageHeader } from "@/components/layout/page-header";
import { TradeForm } from "@/components/trades/trade-form";
import { getInstruments, getJournalPreferences, getSetups } from "@/lib/supabase/queries";
export default async function NewTradePage() { const [instruments, preferences, setups] = await Promise.all([getInstruments(), getJournalPreferences(), getSetups()]); return <><PageHeader title="Add a trade" description="Capture the charts first, then record the execution." showAddTrade={false} preferences={preferences} /><TradeForm instruments={instruments} setups={setups} defaultSetupId={preferences.defaultSetupId} timezone={preferences.timezone} /></>; }
