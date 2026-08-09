"use client";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Range = "day" | "month" | "year";
const RANGES: Range[] = ["day", "month", "year"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function TradeDateFilter({ initialRange = "day", initialValue = "" }: { initialRange?: string; initialValue?: string }) {
  const [range, setRange] = useState<Range>(RANGES.includes(initialRange as Range) ? initialRange as Range : "day"); const [value, setValue] = useState(initialValue);
  return <div className="flex flex-wrap items-center gap-2"><input type="hidden" name="dateRange" value={range} /><div className="inline-flex rounded-lg border border-border bg-surface p-1">{RANGES.map((option) => <button key={option} type="button" onClick={() => { setRange(option); setValue(""); }} className={cn("cursor-pointer rounded-md px-3 py-1.5 text-sm capitalize text-muted transition hover:text-foreground", range === option && "filter-chip-active")}>{option}</button>)}</div>{range === "year" ? <Input name="dateValue" type="number" min="2000" max="2100" step="1" placeholder="Year" value={value} onChange={(event) => setValue(event.target.value)} className="w-28" /> : range === "month" ? <MonthPicker value={value} onChange={setValue} /> : <Input name="dateValue" type="date" value={value} onChange={(event) => setValue(event.target.value)} className="w-auto" />}</div>;
}

function MonthPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const now = new Date(); const parsedYear = /^\d{4}-\d{2}$/.test(value) ? Number(value.slice(0, 4)) : now.getFullYear(); const [year, setYear] = useState(parsedYear); const [open, setOpen] = useState(false); const selectedMonth = /^\d{4}-\d{2}$/.test(value) ? Number(value.slice(5, 7)) - 1 : null;
  const label = selectedMonth != null ? `${MONTHS[selectedMonth]} ${value.slice(0, 4)}` : "Choose month";
  function choose(month: number) { onChange(`${year}-${String(month + 1).padStart(2, "0")}`); setOpen(false); }
  function thisMonth() { const current = new Date(); onChange(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`); setYear(current.getFullYear()); setOpen(false); }
  return <div className="relative"><input type="hidden" name="dateValue" value={value} /><button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="control inline-flex min-w-44 cursor-pointer items-center justify-between gap-3 px-3 text-sm"><span className={value ? "text-foreground" : "text-muted"}>{label}</span><CalendarDays className="h-4 w-4 text-muted" /></button>{open ? <div className="surface absolute left-0 top-12 z-40 w-72 p-3 shadow-2xl"><div className="mb-3 flex items-center justify-between"><button type="button" className="icon-action" aria-label="Previous year" onClick={() => setYear((current) => current - 1)}><ChevronLeft className="h-4 w-4" /></button><strong className="text-sm">{year}</strong><button type="button" className="icon-action" aria-label="Next year" onClick={() => setYear((current) => current + 1)}><ChevronRight className="h-4 w-4" /></button></div><div className="grid grid-cols-3 gap-1.5">{MONTHS.map((month, index) => <button key={month} type="button" onClick={() => choose(index)} className={cn("cursor-pointer rounded-md px-2 py-2 text-sm text-muted transition hover:bg-control-hover hover:text-foreground", year === Number(value.slice(0, 4)) && selectedMonth === index && "filter-chip-active")}>{month}</button>)}</div><div className="mt-3 flex items-center justify-between border-t border-border pt-3"><button type="button" onClick={() => { onChange(""); setOpen(false); }} className="cursor-pointer text-xs text-muted transition hover:text-foreground">Clear</button><button type="button" onClick={thisMonth} className="cursor-pointer text-xs font-medium text-primary transition hover:opacity-75">This month</button></div></div> : null}</div>;
}
