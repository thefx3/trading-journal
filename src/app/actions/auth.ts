"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type AuthState = { error?: string; message?: string } | undefined;
export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> { const supabase = await createClient(); const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get("email")), password: String(formData.get("password")) }); if (error) return { error: error.message }; redirect("/journal"); }
export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> { const supabase = await createClient(); const { error } = await supabase.auth.signUp({ email: String(formData.get("email")), password: String(formData.get("password")) }); if (error) return { error: error.message }; return { message: "Account created. Check your email if confirmation is enabled." }; }
export async function signOut() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/login"); }

export async function updatePassword(_: AuthState, formData: FormData): Promise<AuthState> { const password = String(formData.get("password") ?? ""); const confirmation = String(formData.get("confirmation") ?? ""); if (password.length < 8) return { error: "Password must contain at least 8 characters." }; if (password !== confirmation) return { error: "Passwords do not match." }; const supabase = await createClient(); const { error } = await supabase.auth.updateUser({ password }); return error ? { error: error.message } : { message: "Password updated successfully." }; }
