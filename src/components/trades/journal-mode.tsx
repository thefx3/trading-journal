import Link from "next/link";
import { JOURNAL_MODES, normalizeJournalMode } from "@/lib/trading/config";
import { cn } from "@/lib/utils";
import type { JournalMode } from "@/types/database";

const MODE_MARKERS: Record<JournalMode, { letter: string; className: string }> =
  {
    live: {
      letter: "L",
      className: "border-live/25 bg-live/10 text-live",
    },
    study: {
      letter: "S",
      className: "border-study/25 bg-study/10 text-study",
    },
    practice: {
      letter: "P",
      className: "border-practice/25 bg-practice/10 text-practice",
    },
  };

export function JournalModeMarker({ mode }: { mode?: JournalMode | null }) {
  const normalizedMode = normalizeJournalMode(mode);
  const marker = MODE_MARKERS[normalizedMode];
  return (
    <span
      aria-label={JOURNAL_MODES[normalizedMode].label}
      title={JOURNAL_MODES[normalizedMode].label}
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
        marker.className,
      )}
    >
      {marker.letter}
    </span>
  );
}
export function ModeFilter({
  active = "all",
  pathname,
}: {
  active?: JournalMode | "all";
  pathname: string;
}) {
  return (
    <nav
      aria-label="Journal mode"
      className="inline-flex rounded-lg border border-primary/10 bg-primary/[0.025] p-1"
    >
      {(["all", "live", "study", "practice"] as const).map((mode) => {
        const config = mode === "all" ? null : JOURNAL_MODES[mode];
        return (
          <Link
            key={mode}
            href={mode === "all" ? pathname : `${pathname}?mode=${mode}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs capitalize text-muted transition hover:bg-primary/[0.035] hover:text-foreground",
              active === mode && (config?.activeClass ?? "filter-chip-active"),
            )}
          >
            {mode}
          </Link>
        );
      })}
    </nav>
  );
}
export function JournalModeSelector({
  value,
  onChange,
}: {
  value: JournalMode;
  onChange: (mode: JournalMode) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Journal mode</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {(
          Object.entries(JOURNAL_MODES) as [
            JournalMode,
            (typeof JOURNAL_MODES)[JournalMode],
          ][]
        ).map(([mode, config]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
            className={cn(
              "rounded-lg border border-border bg-control/35 p-3 text-left transition hover:border-primary/30 hover:bg-control-hover",
              value === mode && config.activeClass,
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wide">
              {config.label}
            </span>
            <span className="mt-1 block text-[11px] leading-4 text-muted">
              {config.description}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
