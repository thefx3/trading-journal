"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  cleanupOrphanedCharts,
  type StorageCleanupState,
} from "@/app/actions/storage";
import { Button } from "@/components/ui/button";

const initialState: StorageCleanupState = { status: "idle" };

export function StorageCleanup() {
  const [state, action, pending] = useActionState(
    cleanupOrphanedCharts,
    initialState,
  );
  return (
    <div className="shrink-0">
      <form action={action}>
        <Button type="submit" variant="outline" disabled={pending}>
          <Trash2 className="h-4 w-4" />
          {pending ? "Checking..." : "Clean unused files"}
        </Button>
      </form>
      {state?.message ? (
        <p
          className={`mt-2 text-xs ${state.status === "error" ? "text-danger" : "text-muted"}`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
