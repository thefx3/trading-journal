"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StorageCleanupState =
  { status: "idle" | "success" | "error"; message?: string } | undefined;

async function listAll(
  storage: Awaited<ReturnType<typeof createClient>>["storage"],
  path: string,
) {
  const entries: { name: string; id: string | null }[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await storage.from("trade-charts").list(path, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    entries.push(...(data ?? []).map(({ name, id }) => ({ name, id })));
    if (!data || data.length < 100) break;
    offset += data.length;
  }
  return entries;
}

export async function cleanupOrphanedCharts(
  _: StorageCleanupState,
): Promise<StorageCleanupState> {
  void _;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      status: "error",
      message: "Your session expired. Please sign in again.",
    };

  try {
    const { data: rows, error: rowsError } = await supabase
      .from("trade_images")
      .select("storage_path");
    if (rowsError) throw rowsError;
    const referenced = new Set(
      (rows ?? []).map(({ storage_path }) => storage_path),
    );
    const tradeFolders = await listAll(supabase.storage, user.id);
    const storedPaths: string[] = [];

    for (const folder of tradeFolders) {
      if (folder.id) continue;
      const folderPath = `${user.id}/${folder.name}`;
      const files = await listAll(supabase.storage, folderPath);
      storedPaths.push(
        ...files
          .filter((file) => file.id)
          .map((file) => `${folderPath}/${file.name}`),
      );
    }

    const orphaned = storedPaths.filter((path) => !referenced.has(path));
    if (orphaned.length) {
      const { error } = await supabase.storage
        .from("trade-charts")
        .remove(orphaned);
      if (error) throw error;
    }
    revalidatePath("/settings");
    return {
      status: "success",
      message: orphaned.length
        ? `${orphaned.length} unused chart${orphaned.length === 1 ? "" : "s"} removed.`
        : "No unused charts found.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Storage cleanup failed.",
    };
  }
}
