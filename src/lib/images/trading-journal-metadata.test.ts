import { describe, expect, it } from "vitest";
import { readTradingJournalMetadata } from "./trading-journal-metadata";
import { compareTimeframesDescending, TIMEFRAMES } from "../trading/config";
import { matchesTimeframeFilter, parseTimeframeFilter } from "../trading/filters";
import { imageMetaSchema } from "../validation/trade";
import type { Trade } from "../../types/database";

const encoder = new TextEncoder();
function uint32(value: number) { return new Uint8Array([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]); }
function concat(...parts: Uint8Array[]) { const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0)); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; }
function chunk(type: string, data: Uint8Array) { return concat(uint32(data.length), encoder.encode(type), data, new Uint8Array(4)); }

function metadataPng(metadata: object) {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const text = encoder.encode(`TradingJournal\0${JSON.stringify(metadata)}`);
  return new File([concat(signature, chunk("tEXt", text), chunk("IEND", new Uint8Array()))], "capture.png", { type: "image/png" });
}

describe("readTradingJournalMetadata", () => {
  it.each(["5min", "1min", "1M"])("reads extension metadata from a %s PNG", async (timeframe) => {
    const metadata = { signature: "trading-journal-capture", version: 1, symbol: "GC", timeframe, preset: "standard", capturedAt: "2026-08-10T12:00:00.000Z" };
    await expect(readTradingJournalMetadata(metadataPng(metadata))).resolves.toEqual(metadata);
  });

  it("rejects unrelated or malformed files", async () => {
    await expect(readTradingJournalMetadata(new File(["not png"], "chart.webp", { type: "image/webp" }))).resolves.toBeNull();
    await expect(readTradingJournalMetadata(metadataPng({ signature: "other", version: 1 }))).resolves.toBeNull();
  });

  it("recognizes optimized extension WebP captures from their filename", async () => {
    const file = new File(["webp"], "MNQ_30min_wide_2026-08-15.webp", { type: "image/webp", lastModified: Date.parse("2026-08-15T10:00:00Z") });
    await expect(readTradingJournalMetadata(file)).resolves.toMatchObject({ symbol: "MNQ", timeframe: "30min", preset: "wide" });
  });

  it("preserves one-minute captures through import, validation, filtering and ordering", async () => {
    const file = new File(["webp"], "GC_1min_standard_2026-09-16.webp", { type: "image/webp" });
    const metadata = await readTradingJournalMetadata(file);
    expect(metadata?.timeframe).toBe("1min");
    expect(TIMEFRAMES).toContain(metadata?.timeframe);
    const [image] = imageMetaSchema.parse([{
      imageType: "entry", timeframe: metadata?.timeframe, instrumentSymbol: metadata?.symbol,
      capturePreset: metadata?.preset, isComposed: true,
    }]);
    const trade = { images: [image] } as unknown as Trade;
    expect(matchesTimeframeFilter(trade, parseTimeframeFilter("1MIN"))).toBe(true);
    expect(matchesTimeframeFilter(trade, parseTimeframeFilter("1M"))).toBe(false);
    expect(["1min", "5min", "1M", "3min"].sort(compareTimeframesDescending)).toEqual(["1M", "5min", "3min", "1min"]);
  });
});
