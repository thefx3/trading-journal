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
  query,
}: {
  active: JournalMode | "all";
  query: URLSearchParams;
}) {
  return (
    <div className="flex flex-wrap gap-2 py-4">
      {filters.map((filter) => {
        const next = new URLSearchParams(query);
        next.delete("page");
        if (filter.value === "all") next.delete("mode");
        else next.set("mode", filter.value);
        return (
          <a
            key={filter.value}
            href={`/journal?${next}`}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-control px-3.5 text-sm text-muted transition hover:bg-control-hover hover:text-foreground",
              active === filter.value && "filter-chip-active",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", filter.dot)} />
            {filter.label}
          </a>
        );
      })}
    </div>
  );
}
