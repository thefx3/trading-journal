import { HardDrive } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { StorageCleanup } from "@/components/settings/storage-cleanup";
import { calculateStorageEstimate } from "@/lib/storage/estimate";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function StorageUsage({
  usedBytes,
  quotaBytes,
  imageCount,
  tradeCount,
}: {
  usedBytes: number | null;
  quotaBytes: number;
  imageCount: number;
  tradeCount: number;
}) {
  const unavailable = usedBytes == null;
  const used = usedBytes ?? 0;
  const remaining = Math.max(0, quotaBytes - used);
  const percentage = Math.min(
    100,
    quotaBytes > 0 ? (used / quotaBytes) * 100 : 0,
  );
  const estimate = calculateStorageEstimate(
    used,
    quotaBytes,
    imageCount,
    tradeCount,
  );
  const warning =
    percentage >= 95
      ? "Storage is almost full. Remove old charts before adding more trades."
      : percentage >= 80
        ? "Storage is running low."
        : null;

  return (
    <Panel>
      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-primary" />
        <h2 className="font-medium">Chart storage</h2>
      </div>
      {unavailable ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          Apply the latest Supabase migration to display storage usage.
        </p>
      ) : (
        <>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-control">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">
                {formatBytes(remaining)} remaining
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatBytes(used)} used of {formatBytes(quotaBytes)}
              </p>
            </div>
            <span className="font-mono text-sm text-secondary">
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            {estimate.estimatedImagesRemaining != null ? (
              <p className="max-w-xl text-xs leading-5 text-muted">
                About {estimate.estimatedImagesRemaining.toLocaleString()}{" "}
                charts or{" "}
                {estimate.estimatedTradesRemaining?.toLocaleString() ?? "-"}{" "}
                trades remaining at your current average.
              </p>
            ) : (
              <span />
            )}
            <StorageCleanup />
          </div>
          {warning ? (
            <p className="mt-3 text-sm font-medium text-danger">{warning}</p>
          ) : null}
        </>
      )}
      {unavailable ? <StorageCleanup /> : null}
    </Panel>
  );
}
