"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, startOfMonth } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { CompactDatePicker } from "@/components/journal/day-overview";
import { cn } from "@/lib/utils";

export function CalendarControls({ month, mode }: { month: string; mode: string }) {
  const router = useRouter(); const selected = parseISO(`${month}-01`); const [open, setOpen] = useState(false); const [pickerMonth, setPickerMonth] = useState(startOfMonth(selected)); const [pending, startTransition] = useTransition();
  const suffix = mode === "all" ? "" : `&mode=${mode}`;
  function go(nextMonth: string) { setOpen(false); startTransition(() => router.replace(`/journal/calendar?month=${nextMonth}${suffix}`, { scroll: false })); }
  const previous = new Date(selected.getFullYear(), selected.getMonth() - 1, 1); const next = new Date(selected.getFullYear(), selected.getMonth() + 1, 1);
  return <div className={cn("relative flex items-center gap-2 transition-opacity", pending && "opacity-60")}><button type="button" className="cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium text-muted transition hover:bg-control-hover hover:text-foreground" onClick={() => go(format(new Date(), "yyyy-MM"))}>Today</button><button type="button" className="icon-action" aria-label="Previous month" onClick={() => go(format(previous, "yyyy-MM"))}><ChevronLeft className="h-4 w-4" /></button><h2 className="min-w-36 text-center text-sm font-semibold">{format(selected, "MMMM yyyy")}</h2><button type="button" className="icon-action" aria-label="Next month" onClick={() => go(format(next, "yyyy-MM"))}><ChevronRight className="h-4 w-4" /></button><button type="button" className="icon-action" aria-label="Choose a date" aria-expanded={open} onClick={() => setOpen((value) => !value)}><CalendarDays className="h-4 w-4" /></button>{open ? <CompactDatePicker month={pickerMonth} selected={selected} onMonthChange={setPickerMonth} onSelect={(day) => go(format(day, "yyyy-MM"))} /> : null}</div>;
}
