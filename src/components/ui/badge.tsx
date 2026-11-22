import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-primary/10 bg-primary/[0.045] px-2 py-0.5 text-xs font-medium text-secondary",
        className,
      )}
      {...props}
    />
  );
}
