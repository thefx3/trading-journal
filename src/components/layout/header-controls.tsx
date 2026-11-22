import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { MarketClock } from "@/components/journal/market-clock";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import type { JournalPreferences } from "@/lib/supabase/queries";

export function HeaderControls({
  preferences,
  showAddTrade = true,
}: {
  preferences: JournalPreferences;
  showAddTrade?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 xl:justify-end xl:pb-0">
      <MarketClock
        timezone={preferences.timezone}
        timeFormat={preferences.timeFormat}
        showSeconds={preferences.showSeconds}
      />
      {showAddTrade ? (
        <Button asChild variant="primary" className="shrink-0">
          <Link href="/trades/new" prefetch>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add a trade</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </Button>
      ) : null}
      <ThemeToggle className="shrink-0" />
      <Link
        href="/settings"
        prefetch
        aria-label="Settings"
        className="control-square shrink-0"
      >
        <Settings className="h-4 w-4" />
      </Link>
    </div>
  );
}
