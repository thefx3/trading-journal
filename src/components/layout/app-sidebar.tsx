"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Library,
  List,
  LogOut,
  Menu,
  Plus,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
};
const links: NavigationItem[] = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/journal/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/trades", label: "Trades", icon: List },
  { href: "/statistics", label: "Statistics", icon: BarChart3, soon: true },
  { href: "/playbook", label: "Playbook", icon: Library, soon: true },
  { href: "/settings", label: "Settings", icon: Settings },
];
function isActive(pathname: string, href: string) {
  return (
    pathname === href || (href !== "/journal" && pathname.startsWith(href))
  );
}
function SoonBadge() {
  return (
    <span className="ml-auto rounded-md border border-primary/10 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-primary/80">
      SOON
    </span>
  );
}
function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/journal"
      prefetch
      onClick={onNavigate}
      className="group flex items-center gap-3"
    >
      <span className="grid h-9 w-9 place-items-center rounded-[0.7rem] border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 font-mono text-base font-bold text-primary shadow-[0_10px_25px_-16px_var(--primary)] transition group-hover:border-primary/35">
        R
      </span>
      <span className="text-lg font-semibold tracking-tight">Risknote</span>
    </Link>
  );
}
function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-1.5">
      {links.map(({ href, label, icon: Icon, soon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={soon ? "#" : href}
            onClick={soon ? undefined : onNavigate}
            aria-current={active ? "page" : undefined}
            aria-disabled={soon}
            prefetch={!soon}
            className={cn(
              "relative flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 text-base text-muted transition hover:border-primary/5 hover:bg-primary/[0.035] hover:text-foreground",
              active &&
                "border-primary/10 bg-gradient-to-r from-primary/10 to-primary/[0.025] text-primary before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
              soon && "pointer-events-none",
            )}
          >
            <Icon
              className={cn("h-5 w-5 shrink-0", active && "text-primary")}
            />
            {label}
            {soon ? <SoonBadge /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-primary/10 bg-gradient-to-b from-primary/[0.045] via-background to-background p-4 lg:flex lg:flex-col">
        <div className="mb-8 px-2">
          <Brand />
        </div>
        <Button asChild variant="primary" className="mb-7 w-full">
          <Link href="/trades/new" prefetch>
            <Plus className="h-5 w-5" />
            Add a trade
          </Link>
        </Button>
        <Navigation pathname={pathname} />
        <Account email={email} />
      </aside>
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-primary/10 bg-background/88 px-4 backdrop-blur-xl lg:hidden">
        <Brand onNavigate={close} />
        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="control-square cursor-pointer"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
            onClick={close}
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(86vw,22rem)] flex-col border-l border-primary/10 bg-gradient-to-b from-primary/[0.045] via-background to-background p-5 pt-20 shadow-2xl">
            <Button asChild variant="primary" className="mb-6 w-full">
              <Link href="/trades/new" prefetch onClick={close}>
                <Plus className="h-5 w-5" />
                Add a trade
              </Link>
            </Button>
            <Navigation pathname={pathname} onNavigate={close} />
            <Account email={email} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
function Account({ email }: { email?: string }) {
  return (
    <div className="mt-auto border-t border-border pt-4">
      <div className="mb-3 truncate px-2 text-sm text-muted">{email}</div>
      <form action={signOut}>
        <Button
          variant="ghost"
          className="w-full cursor-pointer justify-start text-sm"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
