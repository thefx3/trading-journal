import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { deleteTrade } from "@/app/actions/trades";
import { FeedImageGallery } from "@/components/journal/feed-image-gallery";
import { PageHeader } from "@/components/layout/page-header";
import { JournalModeBadge } from "@/components/trades/journal-mode";
import { RValue } from "@/components/trades/result";
import {
  EXECUTION_ERROR_LABELS,
  TradeReviewBadges,
} from "@/components/trades/trade-review-badges";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { SESSION_LABELS } from "@/lib/trading/config";
import { getTrade } from "@/lib/supabase/queries";

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-20">
      <span className="block text-xs text-muted">{label}</span>
      <strong className="mt-1 block text-sm font-medium text-foreground">
        {children}
      </strong>
    </div>
  );
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
      <Panel className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-4 p-5">
        <strong className="text-base">{trade.instrument.symbol}</strong>
        <JournalModeBadge mode={trade.journal_mode} />
        {trade.direction ? (
          <span
            className={
              trade.direction === "long"
                ? "font-semibold text-positive"
                : "font-semibold text-negative"
            }
          >
            {trade.direction.toUpperCase()}
          </span>
        ) : null}
        <TradeReviewBadges trade={trade} />
        <Detail label="Result">
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
        </Detail>
        <Detail
          label={
            trade.trade_status === "missed" ? "Informative R" : "Realized R"
          }
        >
          {trade.realized_r != null ? (
            <RValue value={Number(trade.realized_r)} />
          ) : (
            "—"
          )}
        </Detail>
        {trade.execution_error ? (
          <Detail label="Primary error">
            {EXECUTION_ERROR_LABELS[trade.execution_error]}
          </Detail>
        ) : null}
        <Detail label="Session">{SESSION_LABELS[trade.session]}</Detail>
        <div className="ml-auto flex gap-2">
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
