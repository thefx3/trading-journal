export type TradingJournalImageMetadata = { signature: "trading-journal-capture"; version: 1; symbol: string; timeframe: string; preset: "standard" | "wide"; capturedAt: string };

export async function readTradingJournalMetadata(file: File): Promise<TradingJournalImageMetadata | null> {
  if (file.type !== "image/png") return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length < 8 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) return null;
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
    if (offset + 12 + length > bytes.length) return null;
    const type = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
    if (type === "tEXt") {
      const data = new TextDecoder().decode(bytes.subarray(offset + 8, offset + 8 + length));
      if (data.startsWith("TradingJournal\0")) {
        try {
          const value = JSON.parse(data.slice("TradingJournal\0".length)) as Partial<TradingJournalImageMetadata>;
          if (value.signature === "trading-journal-capture" && value.version === 1 && typeof value.symbol === "string" && typeof value.timeframe === "string" && (value.preset === "standard" || value.preset === "wide") && typeof value.capturedAt === "string") return value as TradingJournalImageMetadata;
        } catch { return null; }
      }
    }
    offset += 12 + length;
  }
  return null;
}
