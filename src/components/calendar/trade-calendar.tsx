import Link from "next/link";
import {
  addDays,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { JournalMode, Trade } from "@/types/database";

const MODE_STYLES: Record<JournalMode, string> = {
  live: "text-live",
  study: "text-study",
  practice: "text-practice",
};
const MODE_LABELS: Record<JournalMode, string> = {
  live: "Live",
  study: "Study",
  practice: "Practice",
};
function signedR(value: number) {
  return `${value > 0 ? "+" : ""}${Number(value.toFixed(2))}R`;
}

export function TradeCalendar({
  trades,
  summaryTrades = trades,
  month = new Date(),
}: {
  trades: Trade[];
  summaryTrades?: Trade[];
  month?: Date;
}) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const weeks = Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (__, day) => addDays(start, week * 7 + day)),
  );
  const grouped = trades.reduce(
    (map, trade) =>
      map.set(trade.trade_date, [...(map.get(trade.trade_date) ?? []), trade]),
    new Map<string, Trade[]>(),
  );
  return (
    <div className="surface overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[repeat(7,minmax(100px,1fr))_170px] border-b border-primary/10 bg-primary/[0.035]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Week"].map(
            (day) => (
              <div
                key={day}
                className="px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-muted"
              >
                {day}
              </div>
            ),
          )}
        </div>
        {weeks.map((days) => {
          const first = format(days[0], "yyyy-MM-dd");
          const last = format(days[6], "yyyy-MM-dd");
          const weekTrades = summaryTrades.filter(
            (trade) =>
              trade.journal_mode === "live" &&
              trade.trade_date >= first &&
              trade.trade_date <= last,
          );
          const metrics = weekTrades.reduce((daysMap, trade) => {
            const current = daysMap.get(trade.trade_date) ?? {
              r: 0,
              count: 0,
              wins: 0,
            };
            current.r += Number(trade.realized_r ?? 0);
            current.count += 1;
            if (trade.result === "win") current.wins += 1;
            daysMap.set(trade.trade_date, current);
            return daysMap;
          }, new Map<string, { r: number; count: number; wins: number }>());
          const daily = [...metrics.values()];
          const totalR = daily.reduce((sum, day) => sum + day.r, 0);
          const count = daily.reduce((sum, day) => sum + day.count, 0);
          const wins = daily.reduce((sum, day) => sum + day.wins, 0);
          const green = daily.filter((day) => day.r > 0).length;
          return (
            <div
              key={first}
              className="grid grid-cols-[repeat(7,minmax(100px,1fr))_170px]"
            >
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const entries = grouped.get(key) ?? [];
                return (
                  <Link
                    key={key}
                    href={`/journal/${key}`}
                    prefetch
                    className={cn(
                      "min-h-24 border-b border-r border-border/80 p-2.5 transition hover:bg-primary/[0.045] sm:min-h-28",
                      !isSameMonth(day, month) && "opacity-25",
                      isToday(day) && "bg-primary/[0.075]",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm text-muted",
                        isToday(day) && "font-semibold text-primary",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {entries.length ? (
                      <div className="mt-2 grid gap-1">
                        {(["live", "study", "practice"] as const).map(
                          (mode) => {
                            const modeTrades = entries.filter(
                              (trade) => trade.journal_mode === mode,
                            );
                            if (!modeTrades.length) return null;
                            const r = modeTrades.reduce(
                              (sum, trade) =>
                                sum + Number(trade.realized_r ?? 0),
                              0,
                            );
                            return (
                              <span
                                key={mode}
                                className={cn(
                                  "truncate text-xs",
                                  MODE_STYLES[mode],
                                )}
                              >
                                {MODE_LABELS[mode]} · {modeTrades.length} ·{" "}
                                {signedR(r)}
                              </span>
                            );
                          },
                        )}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
              <aside className="min-h-24 border-b border-border bg-gradient-to-br from-primary/[0.075] to-surface p-3 sm:min-h-28">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                  Weekly recap
                </p>
                <strong
                  className={cn(
                    "mt-2 block font-mono text-lg",
                    totalR < 0 ? "text-negative" : "text-positive",
                  )}
                >
                  {signedR(totalR)}
                </strong>
                <dl className="mt-2 grid gap-1 text-xs text-muted">
                  <div className="flex justify-between">
                    <dt>Trades</dt>
                    <dd>{count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Win rate</dt>
                    <dd>{count ? Math.round((wins / count) * 100) : 0}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Green days</dt>
                    <dd>
                      {green}/{daily.length}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
          );
        })}
      </div>
    </div>
  );
}
