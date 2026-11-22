"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(
    signIn,
    undefined,
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signUp,
    undefined,
  );
  const state = mode === "login" ? loginState : signupState;
  return (
    <div className="surface ambient-panel w-full max-w-sm p-6 sm:p-8">
      <div className="mb-8">
        <div className="mb-5 grid h-10 w-10 place-items-center rounded-[0.7rem] border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 font-mono font-bold text-primary shadow-[0_10px_25px_-16px_var(--primary)]">
          R
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your trading process, captured clearly.
        </p>
      </div>
      <form
        action={mode === "login" ? loginAction : signupAction}
        className="grid gap-5"
      >
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint="8+ characters">
          <Input
            name="password"
            type="password"
            minLength={8}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
          />
        </Field>
        {state?.error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300"
          >
            {state.error}
          </p>
        ) : null}
        {state?.message ? (
          <p className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">
            {state.message}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          variant="primary"
          disabled={loginPending || signupPending}
        >
          {loginPending || signupPending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-6 cursor-pointer text-sm text-muted transition hover:text-primary"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
