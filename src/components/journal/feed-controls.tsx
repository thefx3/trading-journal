"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { TIMEFRAMES } from "@/lib/trading/config";
import { parseTimeframeFilter } from "@/lib/trading/filters";
import { cn } from "@/lib/utils";
import type { JournalMode } from "@/types/database";
import { CollapsibleFilterPanel } from "@/components/ui/collapsible-filter-panel";

const STATIC_FILTERS = [
  {
    key: "direction",
    label: "Direction",
    values: [
      ["", "All"],
      ["long", "Long"],
      ["short", "Short"],
    ],
  },
  {
    key: "session",
    label: "Session",
    values: [
      ["", "All"],
      ["asia", "Asia"],
      ["london", "London"],
      ["new_york_am", "NY AM"],
      ["new_york_pm", "NY PM"],
      ["other", "Other"],
    ],
  },
  {
    key: "result",
    label: "Result",
    values: [
      ["", "All"],
      ["win", "Win"],
      ["loss", "Loss"],
      ["be", "BE"],
    ],
  },
  {
    key: "validity",
    label: "Validity",
    values: [
      ["", "All"],
      ["valid", "Valid"],
      ["invalid", "Invalid"],
    ],
  },
  {
    key: "execution",
    label: "Execution",
    values: [
      ["", "All"],
      ["good", "Good"],
      ["bad", "Bad"],
    ],
  },
] as const;

type FeedControlsProps = {
  queryString: string;
  instruments: string[];
  activeMode: JournalMode | "all";
};

type Timeframe = (typeof TIMEFRAMES)[number];

export function FeedControls({
  queryString,
  instruments,
  activeMode,
}: FeedControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(new URLSearchParams(queryString).entries()),
  );
  function update(key: string, value: string) {
    const nextValues = {
      ...values,
      mode: activeMode === "all" ? "" : activeMode,
      [key]: value,
      page: "",
    };
    setValues(nextValues);
    const next = new URLSearchParams();
    for (const [name, entry] of Object.entries(nextValues)) {
      if (entry) next.set(name, entry);
    }
    startTransition(() =>
      router.replace(`/journal?${next}`, { scroll: false }),
    );
  }
  function reset() {
    setValues({});
    startTransition(() => router.replace("/journal", { scroll: false }));
  }
  function toggleTimeframe(timeframe: Timeframe) {
    const selected = new Set(selectedTimeframes);
    if (selected.has(timeframe)) selected.delete(timeframe);
    else selected.add(timeframe);
    update(
      "timeframes",
      TIMEFRAMES.filter((item) => selected.has(item)).join(","),
    );
  }
  const instrumentOptions = useMemo<[string, string][]>(
    () => [
      ["", "All"],
      ...instruments.map((value): [string, string] => [value, value]),
    ],
    [instruments],
  );
  const selectedTimeframes = new Set(parseTimeframeFilter(values.timeframes));
  return (
    <CollapsibleFilterPanel
      storageKey="trading-journal:journal-filters-open"
      className={cn("transition-opacity", pending && "opacity-70")}
      actions={
        <button
          type="button"
          onClick={reset}
          className="text-xs text-muted hover:text-primary"
        >
          Reset
        </button>
      }
    >
      <FilterRow
        label="Instrument"
        filterKey="instrument"
        values={instrumentOptions}
        selected={values.instrument ?? ""}
        update={update}
      />
      {STATIC_FILTERS.map((option) => (
        <FilterRow
          key={option.key}
          label={option.label}
          filterKey={option.key}
          values={option.values}
          selected={values[option.key] ?? ""}
          update={update}
        />
      ))}
      <fieldset className="mb-0">
        <legend className="mb-2 text-xs text-muted">
          Timeframes · match all selected
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map((timeframe) => (
            <button
              key={timeframe}
              type="button"
              aria-pressed={selectedTimeframes.has(timeframe)}
              onClick={() => toggleTimeframe(timeframe)}
              className={cn(
                "h-8 rounded-md border border-border bg-control px-2.5 text-xs text-muted transition hover:bg-control-hover hover:text-foreground",
                selectedTimeframes.has(timeframe) && "filter-chip-active",
              )}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </fieldset>
    </CollapsibleFilterPanel>
  );
}

function FilterRow({
  label,
  filterKey,
  values,
  selected,
  update,
}: {
  label: string;
  filterKey: string;
  values: readonly (readonly [string, string])[];
  selected: string;
  update: (key: string, value: string) => void;
}) {
  const shown = values.slice(0, 6);
  return (
    <fieldset className="mb-4 last:mb-0">
      <legend className="mb-2 text-xs text-muted">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {shown.map(([value, text]) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => update(filterKey, value)}
            className={cn(
              "h-8 rounded-md border border-border bg-control px-2.5 text-xs text-muted transition hover:bg-control-hover hover:text-foreground",
              selected === value && "filter-chip-active",
            )}
          >
            {text}
          </button>
        ))}
        {values.length > shown.length ? (
          <details className="relative">
            <summary className="control-square h-8 w-8 cursor-pointer list-none">
              <ChevronDown className="h-3.5 w-3.5" />
            </summary>
            <div className="surface absolute right-0 top-9 z-20 grid min-w-32 gap-1 p-2 shadow-xl">
              {values.slice(6).map(([value, text]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update(filterKey, value)}
                  className={cn(
                    "rounded px-2 py-1 text-left text-xs text-muted hover:bg-control",
                    selected === value && "filter-chip-active",
                  )}
                >
                  {text}
                </button>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </fieldset>
  );
}
