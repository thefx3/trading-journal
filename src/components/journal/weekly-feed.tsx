"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeedCard } from "@/components/journal/feed-card";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

const DESKTOP_BREAKPOINT = 1024;
const DESKTOP_SCROLL_ANCHOR = 128;
const MOBILE_SCROLL_ANCHOR = 184;

type WeeklyFeedProps = {
  days: string[];
  trades: Trade[];
  selectedDate: string;
  activeDate: string;
  todayKey: string;
  queryString: string;
  onActiveDateChange: (date: string) => void;
};

export function WeeklyFeed({
  days,
  trades,
  selectedDate,
  activeDate,
  todayKey,
  queryString,
  onActiveDateChange,
}: WeeklyFeedProps) {
  const router = useRouter();
  const feedRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const dayEntries = useMemo(() => {
    const grouped = new Map<string, Trade[]>();
    for (const trade of trades) {
      const group = grouped.get(trade.trade_date);
      if (group) group.push(trade);
      else grouped.set(trade.trade_date, [trade]);
    }
    return days.map((date) => ({
      date,
      day: parseISO(date),
      trades: grouped.get(date) ?? [],
    }));
  }, [days, trades]);
  const weekKey = dayEntries[0]?.date ?? selectedDate;

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const sections = Array.from(
      feed.querySelectorAll<HTMLElement>("[data-feed-date]"),
    );
    if (!sections.length) return;
    let frame = 0;
    const updateActiveDay = () => {
      frame = 0;
      const feedTop = feed.getBoundingClientRect().top + window.scrollY;
      const atFeedEnd =
        window.scrollY > feedTop &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;
      const anchor =
        window.innerWidth >= DESKTOP_BREAKPOINT
          ? DESKTOP_SCROLL_ANCHOR
          : MOBILE_SCROLL_ANCHOR;
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
    const alignmentFrame = window.requestAnimationFrame(() => {
      feed
        .querySelector<HTMLElement>(`[data-feed-date="${selectedDate}"]`)
        ?.scrollIntoView({ block: "start" });
      scheduleUpdate();
    });
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(feed);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.cancelAnimationFrame(alignmentFrame);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [onActiveDateChange, selectedDate, weekKey]);

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
            {dayEntries.map(({ date, day, trades: dayTrades }) => {
              const count = dayTrades.length;
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
        {dayEntries.map(({ date, day, trades: dayTrades }) => (
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
        ))}
      </div>
    </div>
  );
}
