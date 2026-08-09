"use client";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, pending } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return <button type="button" disabled={pending} onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`} className={cn("control-square cursor-pointer", className)}>{resolvedTheme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-500" />}</button>;
}
