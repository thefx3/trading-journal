"use client";

import { cn } from "@/lib/utils";
import type { JournalMode } from "@/types/database";

const filters: { value: JournalMode | "all"; label: string; dot: string }[] = [
  { value: "all", label: "All", dot: "bg-primary" },
  { value: "live", label: "Live", dot: "bg-live" },
  { value: "study", label: "Study", dot: "bg-study" },
  { value: "practice", label: "Practice", dot: "bg-practice" },
];

export function FeedFilters({
  active,
  onChange,
}: {
  active: JournalMode | "all";
  onChange: (mode: JournalMode | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 py-4">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={cn(
            "inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-control px-3.5 text-sm text-muted transition hover:bg-control-hover hover:text-foreground",
            active === filter.value && "filter-chip-active",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", filter.dot)} />
          {filter.label}
        </button>
      ))}
    </div>
  );
}
