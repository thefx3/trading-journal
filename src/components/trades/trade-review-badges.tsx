import { Badge } from "@/components/ui/badge";
import type { Trade } from "@/types/database";

export const EXECUTION_ERROR_LABELS = {
  hesitation: "Hesitation",
  chase: "Chase",
  oversize: "Oversize",
  early_entry: "Early entry",
  late_entry: "Late entry",
  extra_trade: "Extra trade",
  other: "Other",
} as const;

export function TradeReviewBadges({ trade }: { trade: Trade }) {
  if (!trade.setup_validity || !trade.execution_quality || !trade.trade_status)
    return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Badge className={trade.setup_validity === "valid" ? "border-positive/30 bg-positive/8 text-positive" : "border-negative/30 bg-negative/8 text-negative"}>
        {trade.setup_validity === "valid" ? "Valid setup" : "Invalid setup"}
      </Badge>
      <Badge className={trade.execution_quality === "good" ? "border-positive/30 bg-positive/8 text-positive" : "border-amber-500/30 bg-amber-500/8 text-amber-400"}>
        {trade.execution_quality === "good" ? "Good execution" : "Bad execution"}
      </Badge>
      <Badge className={trade.trade_status === "taken" ? "border-border bg-control text-secondary" : "border-amber-500/30 bg-amber-500/8 text-amber-400"}>
        {trade.trade_status === "taken" ? "Taken" : "Missed"}
      </Badge>
    </div>
  );
}
