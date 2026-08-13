"use client";

import { useEffect, useState } from "react";
import { TradeDateFilter } from "./trade-date-filter";
import { TradeList } from "./trade-list";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/types/database";

function filtersFromLocation() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

export function TradesExplorer({
  trades,
  timezone,
  initialFilters,
}: {
  trades: Trade[];
  timezone: string;
  initialFilters: Record<string, string | undefined>;
}) {
  const [filters, setFilters] =
    useState<Record<string, string | undefined>>(initialFilters);
  useEffect(() => {
    const sync = () => setFilters(filtersFromLocation());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  let visible = trades;
  if (filters.mode)
    visible = visible.filter((trade) => trade.journal_mode === filters.mode);
  if (filters.instrument)
    visible = visible.filter(
      (trade) => trade.instrument.symbol === filters.instrument,
    );
  if (filters.direction)
    visible = visible.filter((trade) => trade.direction === filters.direction);
  if (filters.result)
    visible = visible.filter((trade) => trade.result === filters.result);
  if (filters.session)
    visible = visible.filter((trade) => trade.session === filters.session);
  if (filters.dateValue) {
    const expectedLength =
      filters.dateRange === "year" ? 4 : filters.dateRange === "month" ? 7 : 10;
    if (filters.dateValue.length === expectedLength)
      visible = visible.filter((trade) =>
        filters.dateRange === "day"
          ? trade.trade_date === filters.dateValue
          : trade.trade_date.startsWith(filters.dateValue!),
      );
  }
  const instruments = [
    ...new Set(trades.map((trade) => trade.instrument.symbol)),
  ];
  const options = [
    ["mode", "Mode", ["live", "study", "practice"]],
    ["instrument", "Instrument", instruments],
    ["direction", "Direction", ["long", "short"]],
    ["result", "Result", ["win", "loss", "be"]],
    [
      "session",
      "Session",
      [
        "asia",
        "london",
        "new_york_am",
        "new_york_lunch",
        "new_york_pm",
        "other",
      ],
    ],
  ] as const;
  function apply(form: HTMLFormElement) {
    const next = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;
    const query = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    window.history.pushState(
      null,
      "",
      query.size ? `/trades?${query}` : "/trades",
    );
    setFilters(next);
  }
  return (
    <>
      <p className="mb-4 text-sm text-muted">
        {visible.length} recorded entr{visible.length === 1 ? "y" : "ies"}
      </p>
      <form
        key={JSON.stringify(filters)}
        className="mb-5 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          apply(event.currentTarget);
        }}
      >
        <div className="flex flex-wrap gap-2">
          {options.map(([name, label, values]) => (
            <select
              key={name}
              name={name}
              defaultValue={filters[name] ?? ""}
              className="control px-3 text-sm text-muted"
            >
              <option value="">{label}: All</option>
              {values.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TradeDateFilter
            initialRange={filters.dateRange}
            initialValue={filters.dateValue}
          />
          <Button
            variant="outline"
            className="cursor-pointer border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          >
            Apply
          </Button>
        </div>
      </form>
      <TradeList trades={visible} timezone={timezone} />
    </>
  );
}
