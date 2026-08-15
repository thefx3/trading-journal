import { describe, expect, it } from "vitest";
import { imageMetaSchema, tradeSchema } from "./trade";

const baseTrade = {
  instrumentId: "550e8400-e29b-41d4-a716-446655440000",
  setupId: "",
  instrumentSymbol: "GC",
  journalMode: "live",
  setupFound: "true",
  tradeDate: "2026-08-10",
  entryTime: "09:30",
  timezone: "Europe/Paris",
  direction: "long",
  plannedRr: "2",
  result: "win",
  realizedR: "2",
  session: "new_york_am",
  sessionOverride: "false",
  notes: "",
};

describe("tradeSchema", () => {
  it("accepts a complete live trade", () => {
    expect(tradeSchema.safeParse(baseTrade).success).toBe(true);
  });

  it("requires execution fields for Live and Practice", () => {
    const result = tradeSchema.safeParse({ ...baseTrade, journalMode: "practice", entryTime: "", direction: "", plannedRr: "", result: "", realizedR: "" });
    expect(result.success).toBe(false);
  });
});

describe("imageMetaSchema", () => {
  const image = { imageType: "setup", timeframe: "5min", instrumentSymbol: "GC", capturePreset: "standard", isComposed: true, cropX: 0, cropY: 0, cropWidth: 100, cropHeight: 100, cropZoom: 1, cropRotation: 0, aspectRatio: "4:3" };

  it("accepts six composed charts", () => {
    expect(imageMetaSchema.safeParse(Array.from({ length: 6 }, () => image)).success).toBe(true);
  });

  it("rejects more than six charts", () => {
    expect(imageMetaSchema.safeParse(Array.from({ length: 7 }, () => image)).success).toBe(false);
  });

  it("preserves a chart zoomed out inside its final frame", () => {
    const result = imageMetaSchema.parse([{ ...image, cropZoom: 0.5 }]);
    expect(result[0]?.cropZoom).toBe(0.5);
  });
});
