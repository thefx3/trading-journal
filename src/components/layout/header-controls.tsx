import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { MarketClock } from "@/components/journal/market-clock";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import type { JournalPreferences } from "@/lib/supabase/queries";
export function HeaderControls({ preferences, showAddTrade = true }: { preferences: JournalPreferences; showAddTrade?: boolean }) { return <div className="flex shrink-0 items-center gap-2"><MarketClock timezone={preferences.timezone} timeFormat={preferences.timeFormat} showSeconds={preferences.showSeconds} />{showAddTrade ? <Button asChild className="border-foreground bg-foreground text-background hover:bg-foreground/85"><Link href="/trades/new" prefetch><Plus className="h-4 w-4" />Add a trade</Link></Button> : null}<ThemeToggle /><Link href="/settings" prefetch aria-label="Settings" className="control-square"><Settings className="h-4 w-4" /></Link></div>; }
