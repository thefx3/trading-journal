"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TimePreferenceValues = {
  timezone: string;
  timeFormat: "12h" | "24h";
  showSeconds: boolean;
};
export type PreferenceState = {
  status: "idle" | "success" | "error";
  message?: string;
  values?: TimePreferenceValues;
};

async function authenticatedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function saveTimePreferences(
  _: PreferenceState,
  formData: FormData,
): Promise<PreferenceState> {
  const timezone = String(formData.get("timezone") || "Europe/Paris");
  const timeFormat = formData.get("timeFormat") === "12h" ? "12h" : "24h";
  const showSeconds = formData.get("showSeconds") === "on";
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    const { supabase, user } = await authenticatedProfile();
    const { error } = await supabase
      .from("profiles")
      .update({ timezone, time_format: timeFormat, show_seconds: showSeconds })
      .eq("id", user.id);
    if (error) throw error;
    revalidatePath("/journal");
    revalidatePath("/settings");
    return {
      status: "success",
      message: "Preferences saved",
      values: { timezone, timeFormat, showSeconds },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to save",
    };
  }
}

export async function updateTheme(theme: "light" | "dark" | "system") {
  try {
    const { supabase, user } = await authenticatedProfile();
    const { error } = await supabase
      .from("profiles")
      .update({ theme })
      .eq("id", user.id);
    if (error) return { ok: false };
    revalidatePath("/journal");
    revalidatePath("/settings");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
