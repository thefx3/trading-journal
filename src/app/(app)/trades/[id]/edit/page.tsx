import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TradeForm } from "@/components/trades/trade-form";
import {
  getInstruments,
  getJournalPreferences,
  getTrade,
} from "@/lib/supabase/queries";
export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trade, instruments, preferences] = await Promise.all([
    getTrade(id),
    getInstruments(),
    getJournalPreferences(),
  ]);
  if (!trade) notFound();
  return (
    <>
      <PageHeader
        title={`Edit ${trade.instrument.symbol}`}
        description="Update the occurrence or add new charts."
        controls={false}
      />
      <TradeForm
        trade={trade}
        instruments={instruments}
        timezone={preferences.timezone}
      />
    </>
  );
}
