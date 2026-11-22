import "server-only";
import { createClient } from "./server";
import {
  compareTimeframesDescending,
  normalizeJournalMode,
} from "@/lib/trading/config";
import type { Instrument, Trade } from "@/types/database";
import { cache } from "react";

const TRADE_SELECT =
  "*, instrument:instruments(*), images:trade_images(*), study_entries:study_entries(*)";

function normalizeTrade(trade: Trade): Trade {
  return {
    ...trade,
    journal_mode: normalizeJournalMode(trade.journal_mode),
    setup_found: trade.setup_found ?? true,
    images: (trade.images ?? []).toSorted(
      (a, b) =>
        compareTimeframesDescending(a.timeframe, b.timeframe) ||
        a.position - b.position,
    ),
    study_entries: (trade.study_entries ?? []).toSorted(
      (a, b) => a.position - b.position,
    ),
  };
}

async function withSignedImages(trades: Trade[]) {
  const normalized = trades.map(normalizeTrade);
  const paths = normalized.flatMap((trade) =>
    trade.images.map((image) => image.storage_path),
  );
  if (!paths.length) return normalized;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("trade-charts")
    .createSignedUrls(paths, 3600);
  if (error) throw error;
  const urls = new Map(
    data?.map((item, index) => [paths[index], item.signedUrl]),
  );
  return normalized.map((trade) => ({
    ...trade,
    images: trade.images.map((image) => ({
      ...image,
      signed_url: urls.get(image.storage_path),
    })),
  }));
}

export async function getInstruments(): Promise<Instrument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instruments")
    .select("*")
    .eq("active", true)
    .order("symbol");
  if (error) throw error;
  return data ?? [];
}

export async function getTrades(): Promise<Trade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select(TRADE_SELECT)
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withSignedImages((data ?? []) as unknown as Trade[]);
}

export async function getTradesByIds(ids: string[]): Promise<Trade[]> {
  if (!ids.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select(TRADE_SELECT)
    .in("id", ids);
  if (error) throw error;
  const trades = await withSignedImages((data ?? []) as unknown as Trade[]);
  const positions = new Map(ids.map((id, index) => [id, index]));
  return trades.toSorted(
    (a, b) => (positions.get(a.id) ?? 0) - (positions.get(b.id) ?? 0),
  );
}

export async function getTradeSummaries(): Promise<Trade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select(
      "*, instrument:instruments(*), images:trade_images(id,timeframe,position), study_entries:study_entries(*)",
    )
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((trade) => normalizeTrade(trade as unknown as Trade));
}

export async function getTrade(id: string): Promise<Trade | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trades")
    .select(TRADE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await withSignedImages([data as unknown as Trade]))[0];
}

export type JournalPreferences = {
  timezone: string;
  timeFormat: "12h" | "24h";
  showSeconds: boolean;
  theme: "light" | "dark" | "system";
};
export const getJournalPreferences = cache(
  async (): Promise<JournalPreferences> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("timezone, time_format, show_seconds, theme")
      .maybeSingle();
    const theme = data?.theme;
    return {
      timezone: data?.timezone ?? "Europe/Paris",
      timeFormat: data?.time_format === "12h" ? "12h" : "24h",
      showSeconds: data?.show_seconds ?? true,
      theme: theme === "light" || theme === "system" ? theme : "dark",
    };
  },
);
