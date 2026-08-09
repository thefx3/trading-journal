"use client";
import { useActionState, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { saveTimePreferences, type PreferenceState, type TimePreferenceValues } from "@/app/actions/preferences";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const TIMEZONES = ["Europe/Paris", "America/New_York", "America/Chicago", "Europe/London", "Asia/Tokyo", "UTC"];
const INITIAL_STATE: PreferenceState = { status: "idle" };

export function PreferencesForm({ initial }: { initial: TimePreferenceValues }) {
  const [state, action, pending] = useActionState(saveTimePreferences, INITIAL_STATE); const baseline = state.values ?? initial;
  const [timezone, setTimezone] = useState(initial.timezone); const [timeFormat, setTimeFormat] = useState(initial.timeFormat); const [showSeconds, setShowSeconds] = useState(initial.showSeconds);
  const dirty = timezone !== baseline.timezone || timeFormat !== baseline.timeFormat || showSeconds !== baseline.showSeconds;
  return <div className="grid gap-5"><form action={action} className="surface rounded-lg p-5"><h2 className="font-medium">Market clock</h2><p className="mb-5 mt-1 text-sm text-muted">Controls the clock displayed beside Add a trade.</p><div className="grid gap-4"><Field label="Timezone"><Select name="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}>{TIMEZONES.map((value) => <option key={value}>{value}</option>)}</Select></Field><Field label="Time format"><Select name="timeFormat" value={timeFormat} onChange={(event) => setTimeFormat(event.target.value as "12h" | "24h")}><option value="24h">24-hour</option><option value="12h">12-hour</option></Select></Field><label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="showSeconds" checked={showSeconds} onChange={(event) => setShowSeconds(event.target.checked)} className="accent-blue-600" />Show seconds</label><Button disabled={!dirty || pending} className="mt-2">{pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Saving…</> : state.status === "success" && !dirty ? <><Check className="h-4 w-4" />Saved</> : "Save preferences"}</Button>{state.status === "error" ? <p className="text-sm text-red-500">{state.message}</p> : null}</div></form><ThemePreferences /></div>;
}

function ThemePreferences() { const { theme, setTheme } = useTheme(); const choices: { value: Theme; label: string }[] = [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]; return <section className="surface rounded-lg p-5"><h2 className="font-medium">Appearance</h2><p className="mb-4 mt-1 text-sm text-muted">Choose how the journal looks on this device.</p><div className="grid grid-cols-3 gap-2">{choices.map((choice) => <button key={choice.value} type="button" onClick={() => setTheme(choice.value)} className={cn("control", theme === choice.value && "border-blue-600 bg-blue-500/10 text-blue-500")}>{choice.label}</button>)}</div></section>; }
