"use client";
import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore, useTransition } from "react";
import { updateTheme } from "@/app/actions/preferences";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
type ThemeContextValue = { theme: Theme; resolvedTheme: ResolvedTheme; setTheme: (theme: Theme) => void; pending: boolean };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const mediaQuery = "(prefers-color-scheme: dark)";
function subscribe(callback: () => void) { const media = window.matchMedia(mediaQuery); media.addEventListener("change", callback); return () => media.removeEventListener("change", callback); }
function systemSnapshot() { return window.matchMedia(mediaQuery).matches; }
function serverSnapshot() { return true; }

export function ThemeProvider({ initialTheme, children }: { initialTheme: Theme; children: React.ReactNode }) {
  const [theme, setThemeState] = useState(initialTheme); const systemDark = useSyncExternalStore(subscribe, systemSnapshot, serverSnapshot); const [pending, startTransition] = useTransition();
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemDark ? "dark" : "light" : theme;
  useLayoutEffect(() => { document.documentElement.classList.remove("light", "dark"); document.documentElement.classList.add(resolvedTheme); document.documentElement.style.colorScheme = resolvedTheme; }, [resolvedTheme]);
  function setTheme(next: Theme) { setThemeState(next); localStorage.setItem("risknote-theme", next); startTransition(async () => { await updateTheme(next); }); }
  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, pending }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error("useTheme must be used inside ThemeProvider"); return value; }
