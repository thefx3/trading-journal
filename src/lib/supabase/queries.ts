import "server-only";
import { createClient } from "./server";
import { compareTimeframesDescending, normalizeJournalMode } from "@/lib/trading/config";
import type { Instrument, Setup, StudyEntry, Trade } from "@/types/database";
import type { InstrumentGroup } from "@/lib/trading/config";
import { cache } from "react";

const TRADE_SELECT = "*, instrument:instruments(*), setup:setups(*), images:trade_images(*)";

function normalizeTrade(trade: Trade): Trade {
  return { ...trade, setup_id: trade.setup_id ?? null, setup: trade.setup ?? null, journal_mode: normalizeJournalMode(trade.journal_mode), setup_found: trade.setup_found ?? true, images: (trade.images ?? []).toSorted((a, b) => compareTimeframesDescending(a.timeframe, b.timeframe) || a.position - b.position), study_entries: (trade.study_entries ?? []).toSorted((a, b) => a.position - b.position) };
}

async function withStudyEntries(trades: Trade[]) { if (!trades.length) return trades; const supabase = await createClient(); const { data, error } = await supabase.from("study_entries").select("*").in("trade_id", trades.map((trade) => trade.id)).order("position"); if (error) return trades; const grouped = (data as StudyEntry[]).reduce((map, entry) => map.set(entry.trade_id, [...(map.get(entry.trade_id) ?? []), entry]), new Map<string, StudyEntry[]>()); return trades.map((trade) => ({ ...trade, study_entries: grouped.get(trade.id) ?? [] })); }

async function withSignedImages(trades: Trade[]) {
  const normalized = await withStudyEntries(trades.map(normalizeTrade));
  const paths = normalized.flatMap((trade) => trade.images.map((image) => image.storage_path));
  if (!paths.length) return normalized;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("trade-charts").createSignedUrls(paths, 3600);
  if (error) throw error;
  const urls = new Map(data?.map((item, index) => [paths[index], item.signedUrl]));
  return normalized.map((trade) => ({ ...trade, images: trade.images.map((image) => ({ ...image, signed_url: urls.get(image.storage_path) })) }));
}

export async function getInstruments(): Promise<Instrument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("instruments").select("*").eq("active", true).order("symbol");
  if (error) throw error;
  return data ?? [];
}

export async function getSetups(includeArchived = false): Promise<Setup[]> {
  const supabase = await createClient();
  let query = supabase.from("setups").select("*").order("name");
  if (!includeArchived) query = query.is("archived_at", null);
  const { data, error } = await query;
  if (error?.code === "42P01" || error?.message.includes("setups")) return [];
  if (error) throw error;
  return (data ?? []) as Setup[];
}

export async function getTrades(): Promise<Trade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trades").select(TRADE_SELECT).order("trade_date", { ascending: false }).order("entry_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return withSignedImages((data ?? []) as unknown as Trade[]);
}

export async function getTradeSummaries(): Promise<Trade[]> { const supabase = await createClient(); const { data, error } = await supabase.from("trades").select("*, instrument:instruments(*), setup:setups(*)").order("trade_date", { ascending: false }).order("entry_at", { ascending: false, nullsFirst: false }); if (error) throw error; return withStudyEntries((data ?? []).map((trade) => normalizeTrade({ ...trade, images: [], study_entries: [] } as unknown as Trade))); }

export async function getTrade(id: string): Promise<Trade | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trades").select(TRADE_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await withSignedImages([data as unknown as Trade]))[0];
}

export type JournalPreferences = { timezone: string; timeFormat: "12h" | "24h"; showSeconds: boolean; pinnedInstruments: InstrumentGroup[]; theme: "light" | "dark" | "system"; defaultSetupId: string | null };
export const getJournalPreferences = cache(async (): Promise<JournalPreferences> => {
  const supabase = await createClient();
  const [{ data }, { data: themeProfile }, { data: setupProfile }] = await Promise.all([
    supabase.from("profiles").select("timezone, time_format, show_seconds, pinned_instrument_groups").maybeSingle(),
    supabase.from("profiles").select("theme").maybeSingle(),
    supabase.from("profiles").select("default_setup_id").maybeSingle(),
  ]);
  const theme = themeProfile?.theme;
  return { timezone: data?.timezone ?? "Europe/Paris", timeFormat: data?.time_format === "12h" ? "12h" : "24h", showSeconds: data?.show_seconds ?? true, pinnedInstruments: (data?.pinned_instrument_groups ?? ["NQ", "ES", "YM"]) as InstrumentGroup[], theme: theme === "light" || theme === "system" ? theme : "dark", defaultSetupId: setupProfile?.default_setup_id ?? null };
});
