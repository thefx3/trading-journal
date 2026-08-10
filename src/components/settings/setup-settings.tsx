import { Archive, ArchiveRestore, Check, Plus } from "lucide-react";
import {
  createSetup,
  renameSetup,
  setDefaultSetup,
  setSetupArchived,
} from "@/app/actions/setups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import type { Setup } from "@/types/database";

export function SetupSettings({
  setups,
  defaultSetupId,
}: {
  setups: Setup[];
  defaultSetupId: string | null;
}) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Setups</h2>
          <p className="mt-1 text-sm text-muted">
            Reusable strategy frameworks shared by Live, Study and Practice.
          </p>
        </div>
      </div>
      <form action={createSetup} className="mt-5 flex gap-2">
        <Input
          name="name"
          maxLength={80}
          placeholder="Universal Model"
          required
        />
        <Button
          type="submit"
          variant="outline"
          className="min-w-32 shrink-0 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add setup
        </Button>
      </form>
      <div className="mt-5 divide-y divide-border border-y border-border">
        {setups.length ? (
          setups.map((setup) => (
            <div
              key={setup.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center"
            >
              <form action={renameSetup} className="flex min-w-0 flex-1 gap-2">
                <input type="hidden" name="id" value={setup.id} />
                <Input
                  name="name"
                  defaultValue={setup.name}
                  maxLength={80}
                  disabled={Boolean(setup.archived_at)}
                  required
                />
                <Button
                  type="submit"
                  variant="ghost"
                  disabled={Boolean(setup.archived_at)}
                >
                  Rename
                </Button>
              </form>
              {!setup.archived_at ? (
                <form action={setDefaultSetup}>
                  <input type="hidden" name="setupId" value={setup.id} />
                  <Button
                    type="submit"
                    variant={defaultSetupId === setup.id ? "outline" : "ghost"}
                    disabled={defaultSetupId === setup.id}
                  >
                    {defaultSetupId === setup.id ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                    {defaultSetupId === setup.id ? "Default" : "Set default"}
                  </Button>
                </form>
              ) : null}
              <form action={setSetupArchived}>
                <input type="hidden" name="id" value={setup.id} />
                <input
                  type="hidden"
                  name="archived"
                  value={String(!setup.archived_at)}
                />
                <Button type="submit" variant="ghost">
                  {setup.archived_at ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  {setup.archived_at ? "Restore" : "Archive"}
                </Button>
              </form>
            </div>
          ))
        ) : (
          <p className="py-5 text-sm text-muted">No setups yet.</p>
        )}
      </div>
    </Panel>
  );
}
