"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CollapsibleFilterPanel({
  storageKey,
  title = "Filters",
  actions,
  children,
  className,
}: {
  storageKey: string;
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
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
  return (
    <section className={cn("surface p-4 sm:p-5", className)}>
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          open && "mb-5",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </span>
          <h2 className="section-kicker text-foreground">{title}</h2>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-subtle transition-transform",
              !open && "-rotate-90",
            )}
          />
        </button>
        {actions}
      </div>
      {open ? children : null}
    </section>
  );
}
