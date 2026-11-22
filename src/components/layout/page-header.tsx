import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeaderControls } from "@/components/layout/header-controls";
import {
  getJournalPreferences,
  type JournalPreferences,
} from "@/lib/supabase/queries";

export async function PageHeader({
  title,
  description,
  controls = true,
  showAddTrade = true,
  preferences,
  backHref,
}: {
  title: string;
  description?: string;
  controls?: boolean;
  showAddTrade?: boolean;
  preferences?: JournalPreferences;
  backHref?: string;
}) {
  const resolvedPreferences = controls
    ? (preferences ?? (await getJournalPreferences()))
    : null;
  return (
    <header className="mb-6 grid gap-4 sm:mb-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="control-square shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        ) : null}
        <div className="min-w-0 border-l-2 border-primary/45 pl-3.5">
          <h1 className="truncate text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {resolvedPreferences ? (
        <HeaderControls
          preferences={resolvedPreferences}
          showAddTrade={showAddTrade}
        />
      ) : null}
    </header>
  );
}
