import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TradeForm } from "@/components/trades/trade-form";
import { getInstruments, getJournalPreferences, getSetups, getTrade } from "@/lib/supabase/queries";
export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [trade, instruments, preferences, activeSetups] = await Promise.all([getTrade(id), getInstruments(), getJournalPreferences(), getSetups()]); if (!trade) notFound(); const setups = trade.setup?.archived_at ? [...activeSetups, trade.setup] : activeSetups; return <><PageHeader title={`Edit ${trade.instrument.symbol}`} description="Update the execution details or add new charts." controls={false} /><TradeForm trade={trade} instruments={instruments} setups={setups} defaultSetupId={preferences.defaultSetupId} timezone={preferences.timezone} /></>; }
