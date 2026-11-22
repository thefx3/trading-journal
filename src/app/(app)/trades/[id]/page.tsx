import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { deleteTrade } from "@/app/actions/trades";
import { FeedImageGallery } from "@/components/journal/feed-image-gallery";
import { PageHeader } from "@/components/layout/page-header";
import { JournalModeMarker } from "@/components/trades/journal-mode";
import { RValue } from "@/components/trades/result";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { SESSION_LABELS } from "@/lib/trading/config";
import { getTrade } from "@/lib/supabase/queries";

const EXECUTION_ERROR_LABELS = {
  hesitation: "Hesitation",
  chase: "Chase",
  oversize: "Oversize",
  early_entry: "Early entry",
  late_entry: "Late entry",
  extra_trade: "Extra trade",
  other: "Other",
} as const;

function capitalize(value: string | null) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "—";
}

export default async function TradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await getTrade(id);
  if (!trade) notFound();
  const titleDate = format(
    new Date(`${trade.trade_date}T12:00:00`),
    "d MMMM yyyy",
  );
  return (
    <>
      <PageHeader
        title={titleDate}
        description={`${SESSION_LABELS[trade.session]} · ${trade.journal_mode}`}
        backHref="/journal"
      />
      <Panel className="ambient-panel mb-8 overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-5 text-sm text-secondary">
          <JournalModeMarker mode={trade.journal_mode} />
          <strong className="text-base text-foreground">
            {trade.instrument.symbol}
          </strong>
          <span className="text-border">|</span>
          <span>{capitalize(trade.direction)}</span>
          <span className="text-border">|</span>
          <span>{capitalize(trade.setup_validity)}</span>
          <span className="text-border">|</span>
          <span>{capitalize(trade.execution_quality)}</span>
          <span className="text-border">|</span>
          <span
            className={
              trade.result === "win"
                ? "text-positive"
                : trade.result === "loss"
                  ? "text-negative"
                  : "text-muted"
            }
          >
            {trade.result === "be"
              ? "BE"
              : (trade.result?.toUpperCase() ?? "—")}
          </span>
          {trade.execution_error ? (
            <>
              <span className="text-border">|</span>
              <span>{EXECUTION_ERROR_LABELS[trade.execution_error]}</span>
            </>
          ) : null}
          <span className="text-border">|</span>
          <span>{SESSION_LABELS[trade.session]}</span>
          {trade.realized_r != null ? (
            <RValue
              value={Number(trade.realized_r)}
              className="ml-auto text-xl font-semibold"
            />
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border/70 px-5 py-3">
          <Button asChild variant="outline">
            <Link href={`/trades/${id}/edit`}>Edit</Link>
          </Button>
          <form action={deleteTrade}>
            <input type="hidden" name="id" value={id} />
            <Button variant="destructive">Delete</Button>
          </form>
        </div>
      </Panel>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          {trade.images.length ? (
            <FeedImageGallery
              images={trade.images}
              variant="detail"
              tradeId={id}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border py-20 text-center text-sm text-muted">
              No charts attached.
            </div>
          )}
        </section>
        <aside className="grid content-start gap-6">
          {trade.notes ? (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted">
                {trade.notes}
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
