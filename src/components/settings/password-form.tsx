"use client";
import { useActionState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { updatePassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
export function PasswordForm({ embedded = false }: { embedded?: boolean }) {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  return (
    <form
      action={action}
      className={
        embedded ? "mt-5 border-t border-border pt-5" : "surface rounded-lg p-5"
      }
    >
      {!embedded ? (
        <>
          <h2 className="font-medium">Password</h2>
          <p className="mb-5 mt-1 text-sm text-muted">
            Use at least 8 characters for your new password.
          </p>
        </>
      ) : null}
      <div className="grid gap-4">
        <Field label="New password">
          <Input
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Confirm password">
          <Input
            name="confirmation"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </Field>
        <Button disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Updating…
            </>
          ) : state?.message ? (
            <>
              <Check className="h-4 w-4" />
              Updated
            </>
          ) : (
            "Update password"
          )}
        </Button>
        {state?.error ? (
          <p role="alert" className="text-sm text-red-500">
            {state.error}
          </p>
        ) : null}
        {state?.message ? (
          <p role="status" className="text-sm text-emerald-500">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
