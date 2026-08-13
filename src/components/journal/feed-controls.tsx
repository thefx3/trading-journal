"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { INSTRUMENT_GROUPS, type InstrumentGroup } from "@/lib/trading/config";
import { cn } from "@/lib/utils";
import type { JournalMode, Setup } from "@/types/database";

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
] as const;

export function FeedControls({
  query,
  lockedInstrument,
  setups,
  activeMode,
}: {
  query: URLSearchParams;
  lockedInstrument?: InstrumentGroup;
  setups: Setup[];
  activeMode: JournalMode | "all";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries([...query.entries()]),
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
    Object.entries(nextValues).forEach(([name, entry]) => {
      if (entry) next.set(name, entry);
    });
    startTransition(() =>
      router.replace(`/journal?${next}`, { scroll: false }),
    );
  }
  function reset() {
    setValues({});
    startTransition(() => router.replace("/journal", { scroll: false }));
  }
  const instruments: [string, string][] = [
    ["", "All"],
    ...Object.keys(INSTRUMENT_GROUPS).map(
      (value) => [value, value] as [string, string],
    ),
  ];
  const setupOptions: [string, string][] = [
    ["", "All"],
    ["none", "No model"],
    ...setups.map((setup) => [setup.id, setup.name] as [string, string]),
  ];
  return (
    <section
      className={cn("surface p-4 transition-opacity", pending && "opacity-70")}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <button
          onClick={reset}
          className="text-xs text-muted hover:text-primary"
        >
          Reset
        </button>
      </div>
      <FilterRow
        label="Instrument"
        filterKey="filterInstrument"
        values={instruments}
        selected={lockedInstrument ?? values.filterInstrument ?? ""}
        disabled={Boolean(lockedInstrument)}
        update={update}
      />
      <FilterRow
        label="Setup"
        filterKey="setup"
        values={setupOptions}
        selected={values.setup ?? ""}
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
    </section>
  );
}

function FilterRow({
  label,
  filterKey,
  values,
  selected,
  disabled,
  update,
}: {
  label: string;
  filterKey: string;
  values: readonly (readonly [string, string])[];
  selected: string;
  disabled?: boolean;
  update: (key: string, value: string) => void;
}) {
  const shown = values.slice(0, 6);
  return (
    <fieldset
      disabled={disabled}
      className="mb-4 last:mb-0 disabled:opacity-35"
    >
      <legend className="mb-2 text-xs text-muted">
        {label}
        {disabled ? " · preset by tab" : ""}
      </legend>
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
