import { describe, expect, it } from "vitest";
import { imageMetaSchema, tradeSchema } from "./trade";

const baseTrade = {
  instrumentId: "550e8400-e29b-41d4-a716-446655440000",
  instrumentSymbol: "GC",
  journalMode: "live",
  tradeDate: "2026-08-10",
  timezone: "Europe/Paris",
  direction: "long",
  realizedR: "2",
  setupValidity: "valid",
  executionQuality: "good",
  tradeStatus: "taken",
  executionError: "",
  session: "new_york_am",
  notes: "",
};

describe("tradeSchema", () => {
  it("accepts a complete live trade", () => {
    expect(tradeSchema.safeParse(baseTrade).success).toBe(true);
  });

  it("uses the same required fields for Study and Practice", () => {
    const result = tradeSchema.safeParse({
      ...baseTrade,
      journalMode: "study",
      direction: "",
      realizedR: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an informative R for a missed valid opportunity", () => {
    const result = tradeSchema.safeParse({
      ...baseTrade,
      setupValidity: "valid",
      executionQuality: "bad",
      tradeStatus: "missed",
      executionError: "hesitation",
      realizedR: "2",
    });
    expect(result.success).toBe(true);
  });

  it("requires a reason for bad execution", () => {
    const result = tradeSchema.safeParse({
      ...baseTrade,
      executionQuality: "bad",
      executionError: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missed invalid setup", () => {
    const result = tradeSchema.safeParse({
      ...baseTrade,
      setupValidity: "invalid",
      executionQuality: "bad",
      tradeStatus: "missed",
      executionError: "hesitation",
      realizedR: "2",
    });
    expect(result.success).toBe(false);
  });
});

describe("imageMetaSchema", () => {
  const image = {
    imageType: "setup",
    timeframe: "5min",
    instrumentSymbol: "GC",
    capturePreset: "standard",
    isComposed: true,
    cropX: 0,
    cropY: 0,
    cropWidth: 100,
    cropHeight: 100,
    cropZoom: 1,
    cropRotation: 0,
    aspectRatio: "4:3",
  };

  it("accepts six composed charts", () => {
    expect(
      imageMetaSchema.safeParse(Array.from({ length: 6 }, () => image)).success,
    ).toBe(true);
  });

  it("rejects more than six charts", () => {
    expect(
      imageMetaSchema.safeParse(Array.from({ length: 7 }, () => image)).success,
    ).toBe(false);
  });

  it("preserves a chart zoomed out inside its final frame", () => {
    const result = imageMetaSchema.parse([{ ...image, cropZoom: 0.5 }]);
    expect(result[0]?.cropZoom).toBe(0.5);
  });
});
