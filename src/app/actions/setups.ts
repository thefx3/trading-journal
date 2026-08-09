"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const nameSchema = z.string().trim().min(1, "Enter a setup name.").max(80);

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session expired.");
  return { supabase, user };
}

function refreshSetupConsumers() {
  revalidatePath("/settings");
  revalidatePath("/journal");
  revalidatePath("/trades");
}

export async function createSetup(formData: FormData) {
  const name = nameSchema.parse(formData.get("name"));
  const { supabase, user } = await authenticatedClient();
  const { error } = await supabase.from("setups").insert({ user_id: user.id, name });
  if (error) throw new Error(error.code === "23505" ? "A setup with this name already exists." : error.message);
  refreshSetupConsumers();
}

export async function renameSetup(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const name = nameSchema.parse(formData.get("name"));
  const { supabase, user } = await authenticatedClient();
  const { error } = await supabase.from("setups").update({ name }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.code === "23505" ? "A setup with this name already exists." : error.message);
  refreshSetupConsumers();
}

export async function setSetupArchived(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const archived = formData.get("archived") === "true";
  const { supabase, user } = await authenticatedClient();
  const { error } = await supabase.from("setups").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  if (archived) await supabase.from("profiles").update({ default_setup_id: null }).eq("id", user.id).eq("default_setup_id", id);
  refreshSetupConsumers();
}

export async function setDefaultSetup(formData: FormData) {
  const rawId = String(formData.get("setupId") || "");
  const setupId = rawId ? idSchema.parse(rawId) : null;
  const { supabase, user } = await authenticatedClient();
  if (setupId) { const { data } = await supabase.from("setups").select("id").eq("id", setupId).eq("user_id", user.id).is("archived_at", null).maybeSingle(); if (!data) throw new Error("This setup is not available."); }
  const { error } = await supabase.from("profiles").update({ default_setup_id: setupId }).eq("id", user.id);
  if (error) throw new Error(error.message);
  refreshSetupConsumers();
}
