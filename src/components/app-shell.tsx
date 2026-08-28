import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CalendarCheck, LayoutDashboard, ListTodo, Mail, Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Smart Email Generator", icon: Mail },
  { to: "/meetings", label: "Meeting Notes Intelligence", icon: CalendarCheck },
  { to: "/tasks", label: "AI Task Planner", icon: ListTodo },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground shadow-sm" }}
        >
          <Icon className="size-4.5 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-6 py-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">AI Workplace</span>
        <span className="block text-xs text-sidebar-foreground/80">Productivity Assistant</span>
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-sidebar md:flex">
        <Brand />
        <NavList />
        <div className="mt-auto p-4">
          <p className="rounded-xl bg-sidebar-accent/70 p-3 text-xs leading-relaxed text-sidebar-foreground">
            AI assists — you review, edit and approve. Nothing is sent or actioned automatically.
          </p>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-sidebar shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                className="min-h-11 min-w-11 text-white hover:bg-sidebar-accent hover:text-white"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="md:pl-72">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/85 px-4 py-3 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            className="min-h-11 min-w-11"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-sm font-semibold">AI Workplace Productivity Assistant</span>
        </header>
        <main className={cn("mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10")}>{children}</main>
      </div>
    </div>
  );
}
