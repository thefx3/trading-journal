"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { TradeCardView } from "./trade-card-view";
import { TradeDateFilter } from "./trade-date-filter";
import { TradeList } from "./trade-list";
import { Button } from "@/components/ui/button";
import { CollapsibleFilterPanel } from "@/components/ui/collapsible-filter-panel";
import { TIMEFRAMES } from "@/lib/trading/config";
import {
  matchesResultFilter,
  matchesTimeframeFilter,
  parseTimeframeFilter,
} from "@/lib/trading/filters";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

type TradeView = "list" | "cards";

function parseTradeView(value: string | undefined): TradeView {
  return value === "cards" ? "cards" : "list";
}

function explorerStateFromLocation() {
  const filters = Object.fromEntries(
    new URLSearchParams(window.location.search),
  );
  const view = parseTradeView(filters.view);
  delete filters.view;
  return { filters, view };
}

function initialExplorerFilters(
  initialFilters: Record<string, string | undefined>,
) {
  const filters = { ...initialFilters };
  delete filters.view;
  return filters;
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
  const [filters, setFilters] = useState<Record<string, string | undefined>>(
    () => initialExplorerFilters(initialFilters),
  );
  const [view, setView] = useState<TradeView>(() =>
    parseTradeView(initialFilters.view),
  );
  useEffect(() => {
    const sync = () => {
      const state = explorerStateFromLocation();
      setFilters(state.filters);
      setView(state.view);
    };
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
    visible = visible.filter((trade) =>
      matchesResultFilter(trade, filters.result),
    );
  if (filters.validity)
    visible = visible.filter(
      (trade) => trade.setup_validity === filters.validity,
    );
  if (filters.execution)
    visible = visible.filter(
      (trade) => trade.execution_quality === filters.execution,
    );
  if (filters.session)
    visible = visible.filter((trade) => trade.session === filters.session);
  const selectedTimeframes = parseTimeframeFilter(filters.timeframes);
  if (selectedTimeframes.length)
    visible = visible.filter((trade) =>
      matchesTimeframeFilter(trade, selectedTimeframes),
    );
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
    ["validity", "Validity", ["valid", "invalid"]],
    ["execution", "Execution", ["good", "bad"]],
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
    const formData = new FormData(form);
    const next = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;
    next.timeframes = TIMEFRAMES.filter((timeframe) =>
      formData.getAll("timeframes").includes(timeframe),
    ).join(",");
    const query = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    if (view === "cards") query.set("view", view);
    window.history.pushState(
      null,
      "",
      query.size ? `/trades?${query}` : "/trades",
    );
    setFilters(next);
  }
  function changeView(nextView: TradeView) {
    if (nextView === view) return;
    const query = new URLSearchParams(window.location.search);
    if (nextView === "cards") query.set("view", nextView);
    else query.delete("view");
    window.history.replaceState(
      null,
      "",
      query.size ? `/trades?${query}` : "/trades",
    );
    setView(nextView);
  }
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {visible.length} recorded entr{visible.length === 1 ? "y" : "ies"}
        </p>
        <div
          role="group"
          aria-label="Trade view"
          className="inline-flex rounded-lg border border-border bg-control p-1"
        >
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => changeView("list")}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted transition hover:text-foreground",
              view === "list" &&
                "bg-surface-raised text-foreground shadow-sm ring-1 ring-primary/10",
            )}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            type="button"
            aria-pressed={view === "cards"}
            onClick={() => changeView("cards")}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted transition hover:text-foreground",
              view === "cards" &&
                "bg-surface-raised text-foreground shadow-sm ring-1 ring-primary/10",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
        </div>
      </div>
      <CollapsibleFilterPanel
        storageKey="trading-journal:trades-filters-open"
        className="mb-5"
      >
        <form
          key={JSON.stringify(filters)}
          className="grid gap-3"
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
          <fieldset>
            <legend className="mb-2 text-xs text-muted">
              Timeframes · match all selected
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {TIMEFRAMES.map((timeframe) => (
                <label key={timeframe} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    name="timeframes"
                    value={timeframe}
                    defaultChecked={selectedTimeframes.includes(timeframe)}
                  />
                  <span
                    className={cn(
                      "grid h-8 place-items-center rounded-md border border-border bg-control px-2.5 text-xs text-muted transition hover:bg-control-hover hover:text-foreground",
                      "peer-checked:border-primary/55 peer-checked:bg-primary/15 peer-checked:text-primary",
                    )}
                  >
                    {timeframe}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
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
      </CollapsibleFilterPanel>
      {view === "cards" && visible.length ? (
        <TradeCardView trades={visible} />
      ) : (
        <TradeList trades={visible} timezone={timezone} />
      )}
    </>
  );
}
