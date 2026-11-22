"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeedCard } from "@/components/journal/feed-card";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

export function WeeklyFeed({
  days,
  trades,
  selectedDate,
  activeDate,
  todayKey,
  queryString,
  onActiveDateChange,
}: {
  days: string[];
  trades: Trade[];
  selectedDate: string;
  activeDate: string;
  todayKey: string;
  queryString: string;
  onActiveDateChange: (date: string) => void;
}) {
  const router = useRouter();
  const feedRef = useRef<HTMLDivElement>(null);
  const alignedWeekRef = useRef<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [trackingReady, setTrackingReady] = useState(false);
  const tradesByDay = useMemo(() => {
    const grouped = new Map<string, Trade[]>();
    trades.forEach((trade) => {
      grouped.set(trade.trade_date, [
        ...(grouped.get(trade.trade_date) ?? []),
        trade,
      ]);
    });
    return grouped;
  }, [trades]);
  const weekKey = days[0] ?? selectedDate;

  useEffect(() => {
    if (alignedWeekRef.current === weekKey) return;
    alignedWeekRef.current = weekKey;
    const frame = window.requestAnimationFrame(() => {
      const target = feedRef.current?.querySelector<HTMLElement>(
        `[data-feed-date="${selectedDate}"]`,
      );
      target?.scrollIntoView({ block: "start" });
      setTrackingReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedDate, weekKey]);

  useEffect(() => {
    if (!trackingReady) return;
    const sections = Array.from(
      feedRef.current?.querySelectorAll<HTMLElement>("[data-feed-date]") ?? [],
    );
    if (!sections.length) return;
    let frame = 0;
    const updateActiveDay = () => {
      frame = 0;
      const feedTop =
        (feedRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
      const atFeedEnd =
        window.scrollY > feedTop &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;
      const anchor = window.innerWidth >= 1024 ? 128 : 184;
      const activeSection = atFeedEnd
        ? sections.at(-1)
        : (sections.reduce<HTMLElement | undefined>((current, section) => {
            const top = section.getBoundingClientRect().top;
            return top <= anchor ? section : current;
          }, undefined) ?? sections[0]);
      const date = activeSection?.dataset.feedDate;
      if (date) onActiveDateChange(date);
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveDay);
    };
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [onActiveDateChange, trackingReady, weekKey]);

  function scrollToDay(date: string) {
    const target = feedRef.current?.querySelector<HTMLElement>(
      `[data-feed-date="${date}"]`,
    );
    if (!target) return;
    onActiveDateChange(date);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function changeWeek(offset: number) {
    const query = new URLSearchParams(queryString);
    query.set("date", format(addDays(parseISO(weekKey), offset), "yyyy-MM-dd"));
    startTransition(() =>
      router.replace(`/journal?${query}`, { scroll: false }),
    );
  }

  return (
    <div className={cn("transition-opacity", pending && "opacity-65")}>
      <div className="sticky top-16 z-20 -mx-1 bg-background/90 px-1 py-3 backdrop-blur-xl lg:top-0">
        <div className="surface grid grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-2 p-2">
          <button
            type="button"
            className="icon-action"
            aria-label="Previous week"
            onClick={() => changeWeek(-7)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((date) => {
              const day = parseISO(date);
              const count = tradesByDay.get(date)?.length ?? 0;
              const active = date === activeDate;
              const future = date > todayKey;
              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${format(day, "EEEE d MMMM")}${count ? `, ${count} trades` : ", no trades"}`}
                  onClick={() => scrollToDay(date)}
                  className={cn(
                    "group min-w-0 cursor-pointer rounded-md px-0.5 py-1 text-center",
                    future && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "block truncate text-[10px] font-medium text-muted transition group-hover:text-foreground sm:text-[11px]",
                      active && "text-foreground",
                    )}
                  >
                    <span className="sm:hidden">{format(day, "EEE")}</span>
                    <span className="hidden sm:inline">
                      {format(day, "EEEE")}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[10px] text-subtle">
                    {format(day, "d MMM")}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "mt-2 block h-1 rounded-full bg-control transition-all",
                      count > 0 && "bg-primary/30",
                      active && "bg-primary shadow-[0_0_10px_var(--primary)]",
                    )}
                  />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="icon-action"
            aria-label="Next week"
            onClick={() => changeWeek(7)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={feedRef}>
        {days.map((date) => {
          const day = parseISO(date);
          const dayTrades = tradesByDay.get(date) ?? [];
          return (
            <section
              key={date}
              data-feed-date={date}
              className="scroll-mt-44 border-b border-border/70 py-5 first:pt-2 lg:scroll-mt-28"
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {format(day, "EEEE")}
                  <span className="ml-2 font-normal text-muted">
                    {format(day, "d MMMM")}
                  </span>
                </h2>
                <span className="text-xs text-subtle">
                  {dayTrades.length || "No"} trade
                  {dayTrades.length === 1 ? "" : "s"}
                </span>
              </div>
              {dayTrades.length ? (
                <div className="divide-y divide-border/60">
                  {dayTrades.map((trade) => (
                    <FeedCard key={trade.id} trade={trade} />
                  ))}
                </div>
              ) : (
                <div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-border/70 text-sm text-subtle">
                  No trades
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
