import { format, isValid, parse } from "date-fns";
import { CalendarExplorer } from "@/components/calendar/calendar-explorer";
import { PageHeader } from "@/components/layout/page-header";
import { getTradeSummaries } from "@/lib/supabase/queries";
import type { JournalMode } from "@/types/database";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; month?: string }>;
}) {
  const params = await searchParams;
  const parsed = params.month
    ? parse(params.month, "yyyy-MM", new Date())
    : new Date();
  const month = isValid(parsed) ? parsed : new Date();
  const active = (
    ["live", "study", "practice"].includes(params.mode ?? "")
      ? params.mode
      : "all"
  ) as JournalMode | "all";
  const trades = await getTradeSummaries();
  return (
    <>
      <PageHeader title="Calendar" description="Monthly overview" />
      <CalendarExplorer
        trades={trades}
        initialMonth={format(month, "yyyy-MM")}
        initialMode={active}
      />
    </>
  );
}
