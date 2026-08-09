import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"; import { cn } from "@/lib/utils";
const base = "h-10 w-full rounded-lg border border-border bg-control px-3 text-[13px] text-foreground outline-none transition focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn(base, className)} {...props} />; }
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn(base, className)} {...props} />; }
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn(base, "min-h-28 py-3", className)} {...props} />; }
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="grid gap-2 text-[13px] font-medium text-foreground"><span>{label}{hint ? <small className="ml-2 font-normal text-subtle">{hint}</small> : null}</span>{children}</label>; }
