"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import type { PerformanceMetrics } from "@/lib/trading/metrics";

export function DayOverview({
  date,
  metrics,
  queryString,
}: {
  date: string;
  metrics: PerformanceMetrics;
  queryString: string;
}) {
  const router = useRouter();
  const selected = parseISO(date);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(startOfMonth(selected));
  const [pending, startTransition] = useTransition();
  const closed = metrics.wins + metrics.losses + metrics.breakEven;
  function select(nextDate: string) {
    const query = new URLSearchParams(queryString);
    query.set("date", nextDate);
    setPickerOpen(false);
    startTransition(() =>
      router.replace(`/journal?${query}`, { scroll: false }),
    );
  }
  return (
    <Panel
      className={cn(
        "ambient-panel relative overflow-visible transition-opacity",
        pending && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h2 className="section-kicker text-foreground">Day overview</h2>
            <p className="mt-0.5 text-xs text-subtle">Recorded live trades</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="icon-action"
            aria-label="Previous day"
            onClick={() => select(format(addDays(selected, -1), "yyyy-MM-dd"))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-28 text-center text-sm text-muted">
            {format(selected, "d MMM yyyy")}
          </span>
          <button
            type="button"
            className="icon-action"
            aria-label="Next day"
            onClick={() => select(format(addDays(selected, 1), "yyyy-MM-dd"))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="icon-action"
            aria-label="Choose a date"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((value) => !value)}
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>
      {pickerOpen ? (
        <CompactDatePicker
          month={pickerMonth}
          selected={selected}
          onMonthChange={setPickerMonth}
          onSelect={(day) => select(format(day, "yyyy-MM-dd"))}
        />
      ) : null}
      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Summary
          label="Realized R"
          value={`${metrics.totalR > 0 ? "+" : ""}${metrics.totalR.toFixed(1)}R`}
        />
        <Summary label="Trades" value={metrics.total} />
        <Summary label="Win rate" value={`${metrics.winRate.toFixed(0)}%`} />
      </div>
      <div className="mt-4 flex h-1 overflow-hidden rounded-full bg-border">
        <span
          className="bg-emerald-500"
          style={{ width: `${closed ? (metrics.wins / closed) * 100 : 0}%` }}
        />
        <span
          className="bg-red-500"
          style={{ width: `${closed ? (metrics.losses / closed) * 100 : 0}%` }}
        />
        <span className="flex-1 bg-border" />
      </div>
      <p className="mt-2 text-xs text-subtle">
        {metrics.wins}W / {metrics.losses}L / {metrics.breakEven}BE
      </p>
    </Panel>
  );
}

export function CompactDatePicker({
  month,
  selected,
  onMonthChange,
  onSelect,
}: {
  month: Date;
  selected: Date;
  onMonthChange: (date: Date) => void;
  onSelect: (date: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const today = new Date();
  return (
    <div className="surface absolute right-0 top-10 z-40 w-72 p-3 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="icon-action"
          aria-label="Previous month"
          onClick={() => onMonthChange(subMonths(month, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <label className="relative cursor-pointer text-sm font-medium">
          {format(month, "MMMM yyyy")}
          <input
            type="month"
            value={format(month, "yyyy-MM")}
            onChange={(event) =>
              event.target.value &&
              onMonthChange(parseISO(`${event.target.value}-01`))
            }
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Choose month and year"
          />
        </label>
        <button
          type="button"
          className="icon-action"
          aria-label="Next month"
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-subtle">
        {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
          <span key={`${label}-${index}`} className="py-1">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelect(day)}
            className={cn(
              "grid h-8 place-items-center rounded-md text-sm text-muted transition hover:bg-control-hover hover:text-foreground",
              !isSameMonth(day, month) && "opacity-30",
              isSameDay(day, today) && "text-blue-500",
              isSameDay(day, selected) &&
                "bg-blue-600 text-white hover:bg-blue-500 hover:text-white",
            )}
          >
            {format(day, "d")}
          </button>
        ))}
      </div>
    </div>
  );
}
function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="soft-tile min-w-0 p-3">
      <span className="text-xs text-muted">{label}</span>
      <strong className="mt-1 block truncate font-mono text-sm font-semibold text-foreground sm:text-base">
        {value}
      </strong>
    </div>
  );
}
