import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeaderControls } from "@/components/layout/header-controls";
import { getJournalPreferences, type JournalPreferences } from "@/lib/supabase/queries";

export async function PageHeader({ title, description, controls = true, showAddTrade = true, preferences, backHref }: { title: string; description?: string; controls?: boolean; showAddTrade?: boolean; preferences?: JournalPreferences; backHref?: string }) { const resolvedPreferences = controls ? preferences ?? await getJournalPreferences() : null; return <header className="mb-7 flex min-h-12 flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3">{backHref ? <Link href={backHref} aria-label="Go back" className="control-square shrink-0"><ArrowLeft className="h-4 w-4" /></Link> : null}<div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}</div></div>{resolvedPreferences ? <HeaderControls preferences={resolvedPreferences} showAddTrade={showAddTrade} /> : null}</header>; }
