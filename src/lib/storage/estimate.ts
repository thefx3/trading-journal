export type StorageEstimate = {
  averageImageBytes: number | null;
  estimatedImagesRemaining: number | null;
  estimatedTradesRemaining: number | null;
};

export function calculateStorageEstimate(
  usedBytes: number,
  quotaBytes: number,
  imageCount: number,
  tradeCount: number,
): StorageEstimate {
  if (usedBytes <= 0 || imageCount <= 0) {
    return {
      averageImageBytes: null,
      estimatedImagesRemaining: null,
      estimatedTradesRemaining: null,
    };
  }

  const averageImageBytes = usedBytes / imageCount;
  const remainingBytes = Math.max(0, quotaBytes - usedBytes);
  const estimatedImagesRemaining = Math.floor(
    remainingBytes / averageImageBytes,
  );
  const imagesPerTrade = tradeCount > 0 ? imageCount / tradeCount : null;

  return {
    averageImageBytes,
    estimatedImagesRemaining,
    estimatedTradesRemaining: imagesPerTrade
      ? Math.floor(estimatedImagesRemaining / imagesPerTrade)
      : null,
  };
}
