import { PageHeader } from "@/components/layout/page-header";
import { PasswordForm } from "@/components/settings/password-form";
import {
  PreferencesForm,
  ThemePreferences,
} from "@/components/settings/preferences-form";
import { SetupSettings } from "@/components/settings/setup-settings";
import { StorageUsage } from "@/components/settings/storage-usage";
import { Panel } from "@/components/ui/panel";
import { getJournalPreferences, getSetups } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_STORAGE_QUOTA_BYTES = 1_000_000_000;

export default async function SettingsPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: profile },
    preferences,
    setups,
    usageResult,
    imageCountResult,
    tradeCountResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("display_name").maybeSingle(),
    getJournalPreferences(),
    getSetups(true),
    supabase.rpc("get_trade_chart_storage_usage"),
    supabase.from("trade_images").select("id", { count: "exact", head: true }),
    supabase.from("trades").select("id", { count: "exact", head: true }),
  ]);
  const configuredQuota = Number(process.env.STORAGE_QUOTA_BYTES);
  const quotaBytes =
    Number.isFinite(configuredQuota) && configuredQuota > 0
      ? configuredQuota
      : DEFAULT_STORAGE_QUOTA_BYTES;
  const usedBytes = usageResult.error ? null : Number(usageResult.data ?? 0);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Personal journal preferences."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <h2 className="font-medium">Profile</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-1">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Display name</dt>
              <dd className="mt-1">{profile?.display_name || "-"}</dd>
            </div>
          </dl>
          <PasswordForm embedded />
        </Panel>
        <Panel>
          <PreferencesForm
            embedded
            initial={{
              timezone: preferences.timezone,
              timeFormat: preferences.timeFormat,
              showSeconds: preferences.showSeconds,
            }}
          />
          <ThemePreferences embedded />
        </Panel>
        <SetupSettings
          setups={setups}
          defaultSetupId={preferences.defaultSetupId}
        />
        <StorageUsage
          usedBytes={usedBytes}
          quotaBytes={quotaBytes}
          imageCount={imageCountResult.count ?? 0}
          tradeCount={tradeCountResult.count ?? 0}
        />
      </div>
    </>
  );
}
