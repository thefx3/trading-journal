import { calculateMetrics } from "@/lib/trading/metrics";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

export function MonthlyStats({ trades }: { trades: Trade[] }) {
  const liveTrades = trades.filter((trade) => trade.journal_mode === "live");
  const metrics = calculateMetrics(liveTrades);
  const daily = liveTrades.reduce(
    (map, trade) =>
      map.set(
        trade.trade_date,
        (map.get(trade.trade_date) ?? 0) + Number(trade.realized_r ?? 0),
      ),
    new Map<string, number>(),
  );
  const greenDays = [...daily.values()].filter((value) => value > 0).length;
  const cards = [
    {
      label: "Cumulative R",
      value: `${metrics.totalR > 0 ? "+" : ""}${metrics.totalR.toFixed(1)}R`,
      detail: "Recorded live trades",
      valueClass: metrics.totalR < 0 ? "text-negative" : "text-positive",
    },
    {
      label: "Trades",
      value: metrics.total,
      detail: `${metrics.wins}W · ${metrics.losses}L · ${metrics.breakEven}BE`,
      valueClass: "text-foreground",
    },
    {
      label: "Win rate",
      value: `${metrics.winRate.toFixed(0)}%`,
      detail: "Live trades",
      valueClass: "text-primary",
    },
    {
      label: "Green days",
      value: `${greenDays}/${daily.size}`,
      detail: "Positive R / days traded",
      valueClass: "text-positive",
    },
  ];
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <section
          key={card.label}
          className={cn("surface p-4", index === 0 && "ambient-panel")}
        >
          <p className="section-kicker">{card.label}</p>
          <strong
            className={cn(
              "mt-2 block font-mono text-xl font-medium",
              card.valueClass,
            )}
          >
            {card.value}
          </strong>
          <p className="mt-1 text-xs text-subtle">{card.detail}</p>
        </section>
      ))}
    </div>
  );
}
