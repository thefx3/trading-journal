import { describe, expect, it } from "vitest";
import { calculateStorageEstimate } from "./estimate";

describe("calculateStorageEstimate", () => {
  it("estimates remaining images and trades from actual averages", () => {
    expect(calculateStorageEstimate(200, 1000, 4, 2)).toEqual({
      averageImageBytes: 50,
      estimatedImagesRemaining: 16,
      estimatedTradesRemaining: 8,
    });
  });

  it("does not invent an estimate without existing images", () => {
    expect(calculateStorageEstimate(0, 1000, 0, 0)).toEqual({
      averageImageBytes: null,
      estimatedImagesRemaining: null,
      estimatedTradesRemaining: null,
    });
  });
});
