"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CollapsibleFilterPanel({ storageKey, title = "Filters", actions, children, className }: { storageKey: string; title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== "closed") return;
    const timeout = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [storageKey]);
  function toggle() {
    setOpen((current) => {
      const next = !current;
      localStorage.setItem(storageKey, next ? "open" : "closed");
      return next;
    });
  }
  return <section className={cn("surface p-4", className)}><div className={cn("flex items-center justify-between gap-3", open && "mb-4")}><button type="button" onClick={toggle} aria-expanded={open} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"><ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", !open && "-rotate-90")} /><h2 className="text-sm font-semibold">{title}</h2></button>{actions}</div>{open ? children : null}</section>;
}
