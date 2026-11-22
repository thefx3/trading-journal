import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (hasSupabaseEnv()) {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (user) redirect("/journal");
  }
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10 sm:px-6">
      <AuthForm />
    </main>
  );
}
