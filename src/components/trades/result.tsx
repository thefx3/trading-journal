import { cn } from "@/lib/utils";
export function RValue({ value, className }: { value: number; className?: string }) { return <span className={cn("font-mono font-medium tabular-nums", value > 0 ? "text-positive" : value < 0 ? "text-negative" : "text-muted", className)}>{value > 0 ? "+" : ""}{Number(value).toFixed(Number.isInteger(Number(value)) ? 0 : 1)}R</span>; }
