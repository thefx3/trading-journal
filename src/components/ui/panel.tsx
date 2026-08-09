import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Panel({ className, ...props }: ComponentProps<"section">) { return <section className={cn("surface rounded-lg p-4", className)} {...props} />; }
