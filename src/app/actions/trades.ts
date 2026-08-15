"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  existingImageMetaSchema,
  imageMetaSchema,
  studyEntriesSchema,
  tradeSchema,
} from "@/lib/validation/trade";
import { getTradingSession, localTradeTimeToUtc } from "@/lib/trading/sessions";
export type TradeActionState =
  { error?: string; fieldErrors?: Record<string, string[]> } | undefined;
const FILE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function saveTrade(
  _: TradeActionState,
  formData: FormData,
): Promise<TradeActionState> {
  const parsed = tradeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      error: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };
  const input = parsed.data;
  const submittedTradeId = String(formData.get("tradeId") || "");
  const tradeId = submittedTradeId || crypto.randomUUID();
  const files = formData
    .getAll("charts")
    .filter((v): v is File => v instanceof File && v.size > 0);
  const todayParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: input.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  if (input.tradeDate > today)
    return {
      error: "Trades cannot be recorded for a future date.",
      fieldErrors: { tradeDate: ["Choose today or an earlier date."] },
    };
  if (input.setupId) {
    const { data: setup, error } = await supabase
      .from("setups")
      .select("id, archived_at")
      .eq("id", input.setupId)
      .maybeSingle();
    if (error || !setup) return { error: "This setup is not available." };
    const isCurrentSetup =
      String(formData.get("originalSetupId") || "") === input.setupId;
    if (setup.archived_at && !isCurrentSetup)
      return { error: "Archived setups cannot be assigned to new trades." };
  }
  if (
    files.some(
      (file) => !FILE_TYPES.has(file.type) || file.size > MAX_FILE_SIZE,
    )
  )
    return {
      error: "Charts must be PNG, JPEG or WebP and no larger than 10 MB.",
    };
  let existingImageCount = 0;
  if (submittedTradeId) {
    const { count, error: imageCountError } = await supabase
      .from("trade_images")
      .select("id", { count: "exact", head: true })
      .eq("trade_id", tradeId);
    if (imageCountError) return { error: imageCountError.message };
    existingImageCount = count ?? 0;
  }
  if (existingImageCount + files.length > 6)
    return { error: "A trade can contain up to 6 charts." };
  let imageMeta: unknown;
  try {
    imageMeta = JSON.parse(String(formData.get("imageMeta") || "[]"));
  } catch {
    return { error: "Chart metadata is invalid." };
  }
  const metaResult = imageMetaSchema.safeParse(imageMeta);
  if (!metaResult.success)
    return {
      error: `Chart metadata is invalid: ${metaResult.error.issues[0]?.message ?? "unknown validation error"}`,
    };
  if (metaResult.data.length !== files.length)
    return {
      error: `Chart metadata is incomplete (${files.length} file${files.length === 1 ? "" : "s"}, ${metaResult.data.length} description${metaResult.data.length === 1 ? "" : "s"}). Please remove and re-add the affected chart.`,
    };
  let existingImageMeta: unknown = [];
  try {
    existingImageMeta = JSON.parse(
      String(formData.get("existingImageMeta") || "[]"),
    );
  } catch {
    return { error: "Existing chart metadata is invalid." };
  }
  const existingMetaResult =
    existingImageMetaSchema.safeParse(existingImageMeta);
  if (!existingMetaResult.success)
    return { error: "Existing chart crop metadata is invalid." };
  let studyEntries: unknown = [];
  try {
    studyEntries = JSON.parse(String(formData.get("studyEntries") || "[]"));
  } catch {
    return { error: "Study entries are invalid." };
  }
  const studyEntriesResult = studyEntriesSchema.safeParse(studyEntries);
  if (!studyEntriesResult.success)
    return { error: "Please complete every Study entry." };
  studyEntriesResult.data.forEach((entry) => {
    entry.result =
      entry.realizedR > 0 ? "win" : entry.realizedR < 0 ? "loss" : "be";
  });
  if (input.journalMode === "study") {
    const { error } = await supabase
      .from("study_entries")
      .select("id")
      .limit(1);
    if (error)
      return {
        error:
          "Database migration 202608090005_study_entries.sql has not been applied to Supabase.",
      };
  }
  const hasEntryTime = Boolean(input.entryTime);
  const isStudy = input.journalMode === "study";
  const entryInstant =
    !isStudy && hasEntryTime
      ? localTradeTimeToUtc(input.tradeDate, input.entryTime!, input.timezone)
      : null;
  const derivedResult =
    input.realizedR == null
      ? null
      : input.realizedR > 0
        ? "win"
        : input.realizedR < 0
          ? "loss"
          : "be";
  const payload = {
    id: tradeId,
    user_id: user.id,
    instrument_id: input.instrumentId,
    setup_id: input.setupId,
    trade_date: input.tradeDate,
    entry_at: entryInstant?.toISOString() ?? null,
    direction: isStudy ? null : input.direction,
    planned_rr: isStudy ? null : input.plannedRr,
    result: isStudy ? null : derivedResult,
    realized_r: isStudy ? null : input.realizedR,
    journal_mode: input.journalMode,
    setup_found: isStudy ? studyEntriesResult.data.length > 0 : true,
    session: entryInstant
      ? getTradingSession(input.instrumentSymbol, entryInstant)
      : "other",
    session_override: false,
    notes: input.notes || null,
    visibility: "private" as const,
  };
  const studyRows =
    input.journalMode === "study"
      ? studyEntriesResult.data.map((entry, position) => ({
          trade_id: tradeId,
          position,
          entry_at: localTradeTimeToUtc(
            input.tradeDate,
            entry.time,
            input.timezone,
          ).toISOString(),
          session: entry.session,
          session_override: entry.sessionOverride,
          direction: entry.direction,
          planned_rr: entry.plannedRr,
          result: entry.result,
          realized_r: entry.realizedR,
        }))
      : [];
  const uploaded: string[] = [];
  const imageRows: Record<string, unknown>[] = [];
  try {
    const uploadResults = await Promise.all(files.map(async (file, i) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/${tradeId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("trade-charts")
        .upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
      if (error) return { error, path, row: null };
      const meta = metaResult.data[i];
      return { error: null, path, row: {
        trade_id: tradeId,
        storage_path: path,
        image_type: meta.imageType,
        timeframe: meta.timeframe,
        instrument_symbol: meta.instrumentSymbol,
        capture_preset: meta.capturePreset,
        is_composed: meta.isComposed,
        position: i + existingImageCount,
        crop_x: meta.cropX,
        crop_y: meta.cropY,
        crop_width: meta.cropWidth,
        crop_height: meta.cropHeight,
        crop_zoom: meta.cropZoom,
        crop_rotation: meta.cropRotation,
        aspect_ratio: meta.aspectRatio,
      } };
    }));
    uploaded.push(...uploadResults.filter((result) => !result.error).map((result) => result.path));
    const failedUpload = uploadResults.find((result) => result.error);
    if (failedUpload?.error) throw failedUpload.error;
    imageRows.push(...uploadResults.flatMap((result) => result.row ? [result.row] : []));
  } catch (error) {
    if (uploaded.length)
      await supabase.storage.from("trade-charts").remove(uploaded);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Chart upload failed. No database changes were saved.",
    };
  }
  const existingRows = existingMetaResult.data.map((meta) => ({
    id: meta.id,
    crop_x: meta.cropX,
    crop_y: meta.cropY,
    crop_width: meta.cropWidth,
    crop_height: meta.cropHeight,
    crop_zoom: meta.cropZoom,
    crop_rotation: meta.cropRotation,
    aspect_ratio: meta.aspectRatio,
  }));
  const { error: saveError } = await supabase.rpc("save_trade_bundle", {
    p_trade: payload,
    p_study_entries: studyRows,
    p_images: imageRows,
    p_existing_images: existingRows,
  });
  if (saveError) {
    if (uploaded.length)
      await supabase.storage.from("trade-charts").remove(uploaded);
    const migrationMissing =
      saveError.message.includes("save_trade_bundle") ||
      saveError.message.includes("schema cache");
    return {
      error: migrationMissing
        ? "Database migration 202608100004_save_trade_bundle.sql has not been applied to Supabase."
        : saveError.message,
    };
  }
  revalidatePath("/journal");
  revalidatePath("/trades");
  redirect(`/trades/${tradeId}`);
}

export async function deleteTrade(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("trade_images")
    .select("storage_path")
    .eq("trade_id", id);
  const paths = data?.map((x) => x.storage_path) ?? [];
  if (paths.length) {
    const { error } = await supabase.storage.from("trade-charts").remove(paths);
    if (error) throw new Error(`Storage cleanup failed: ${error.message}`);
  }
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/journal");
  revalidatePath("/trades");
  redirect("/trades");
}
export async function deleteTradeImage(formData: FormData) {
  const imageId = String(formData.get("imageId"));
  const tradeId = String(formData.get("tradeId"));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trade_images")
    .select("storage_path")
    .eq("id", imageId)
    .single();
  if (error) throw error;
  const { error: storageError } = await supabase.storage
    .from("trade-charts")
    .remove([data.storage_path]);
  if (storageError) throw storageError;
  await supabase.from("trade_images").delete().eq("id", imageId);
  revalidatePath(`/trades/${tradeId}`);
}
