import { PageHeader } from "@/components/layout/page-header";
import type { JournalPreferences } from "@/lib/supabase/queries";
export function JournalHeader({ preferences }: { preferences: JournalPreferences }) { return <PageHeader title="Journal" description="Review your trades. Every trade, every day." preferences={preferences} />; }
