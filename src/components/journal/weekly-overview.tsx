import { TrendingUp } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import type { WeeklyOverviewMetrics } from "@/lib/trading/metrics";

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${Number(value.toFixed(2))}R`;
}

export function WeeklyOverview({
  metrics,
}: {
  metrics: WeeklyOverviewMetrics;
}) {
  return (
    <Panel className="ambient-panel overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="section-kicker text-foreground">Weekly overview</p>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-5">
        <span className="text-xs text-muted">Cumulative R</span>
        <strong
          className={
            metrics.cumulativeR < 0
              ? "mt-1 block font-mono text-3xl text-negative"
              : "mt-1 block font-mono text-3xl text-positive"
          }
        >
          {signed(metrics.cumulativeR)}
        </strong>
      </div>
      <p className="mt-4 text-sm leading-6 text-secondary">
        <strong className="text-foreground">
          {metrics.greenDays}/{metrics.daysTraded}
        </strong>{" "}
        green days <span className="mx-1 text-border">|</span>{" "}
        <strong className="text-foreground">
          {signed(metrics.averagePerDay)}
        </strong>{" "}
        avg per day <span className="mx-1 text-border">|</span>{" "}
        <strong className="text-foreground">{signed(metrics.bestDay)}</strong>{" "}
        best day
      </p>
    </Panel>
  );
}
