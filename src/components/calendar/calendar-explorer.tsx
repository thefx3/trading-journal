"use client";

import { useEffect, useState } from "react";
import { endOfMonth, format, isValid, parse, startOfMonth } from "date-fns";
import { CalendarControls } from "./calendar-controls";
import { MonthlyStats } from "./monthly-stats";
import { TradeCalendar } from "./trade-calendar";
import { cn } from "@/lib/utils";
import type { JournalMode, Trade } from "@/types/database";

type Mode = JournalMode | "all";
const MODES: Mode[] = ["all", "live", "study", "practice"];
const MODE_STYLES: Record<Mode, string> = {
  all: "border-primary/45 bg-primary/10 text-primary",
  live: "border-live/45 bg-live/10 text-live",
  study: "border-study/45 bg-study/10 text-study",
  practice: "border-practice/45 bg-practice/10 text-practice",
};

export function CalendarExplorer({
  trades,
  initialMonth,
  initialMode,
}: {
  trades: Trade[];
  initialMonth: string;
  initialMode: Mode;
}) {
  const [state, setState] = useState({
    month: initialMonth,
    mode: initialMode,
  });
  useEffect(() => {
    const sync = () => {
      const query = new URLSearchParams(window.location.search);
      const month = query.get("month");
      const mode = query.get("mode");
      setState({
        month: month && /^\d{4}-\d{2}$/.test(month) ? month : initialMonth,
        mode:
          mode === "live" || mode === "study" || mode === "practice"
            ? mode
            : "all",
      });
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [initialMonth]);
  function update(next: Partial<typeof state>) {
    const value = { ...state, ...next };
    const url = new URL(window.location.href);
    url.searchParams.set("month", value.month);
    if (value.mode === "all") url.searchParams.delete("mode");
    else url.searchParams.set("mode", value.mode);
    window.history.pushState(null, "", url);
    setState(value);
  }
  const parsed = parse(state.month, "yyyy-MM", new Date());
  const month = isValid(parsed) ? parsed : new Date();
  const first = format(startOfMonth(month), "yyyy-MM-dd");
  const last = format(endOfMonth(month), "yyyy-MM-dd");
  const monthTrades = trades.filter(
    (trade) => trade.trade_date >= first && trade.trade_date <= last,
  );
  const visible =
    state.mode === "all"
      ? monthTrades
      : monthTrades.filter((trade) => trade.journal_mode === state.mode);
  return (
    <>
      <MonthlyStats trades={monthTrades} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Calendar mode"
          className="inline-flex rounded-lg border border-border bg-surface p-1"
        >
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update({ mode })}
              className={cn(
                "cursor-pointer rounded-md px-3.5 py-2 text-sm capitalize text-muted transition hover:text-foreground",
                state.mode === mode && [MODE_STYLES[mode], "font-semibold"],
              )}
            >
              {mode}
            </button>
          ))}
        </nav>
        <CalendarControls
          month={state.month}
          onChange={(month) => update({ month })}
        />
      </div>
      <TradeCalendar trades={visible} month={month} />
    </>
  );
}
