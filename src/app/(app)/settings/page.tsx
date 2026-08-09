import { PageHeader } from "@/components/layout/page-header";
import { PasswordForm } from "@/components/settings/password-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { SetupSettings } from "@/components/settings/setup-settings";
import { Panel } from "@/components/ui/panel";
import { getJournalPreferences, getSetups } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: { user } }, { data: profile }, preferences, setups] = await Promise.all([supabase.auth.getUser(), supabase.from("profiles").select("display_name").maybeSingle(), getJournalPreferences(), getSetups(true)]);
  return <><PageHeader title="Settings" description="Personal journal preferences." /><div className="settings-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3"><div className="grid content-start gap-5"><Panel><h2 className="font-medium">Profile</h2><dl className="mt-5 grid gap-4 text-sm"><div><dt className="text-muted">Email</dt><dd className="mt-1">{user?.email}</dd></div><div><dt className="text-muted">Display name</dt><dd className="mt-1">{profile?.display_name || "—"}</dd></div></dl></Panel><PasswordForm /></div><PreferencesForm initial={{ timezone: preferences.timezone, timeFormat: preferences.timeFormat, showSeconds: preferences.showSeconds }} /><SetupSettings setups={setups} defaultSetupId={preferences.defaultSetupId} /></div></>;
}
