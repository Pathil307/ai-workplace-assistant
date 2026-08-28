import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  ListTodo,
  Mail,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsibleAiNotice } from "@/components/responsible-ai";
import { daysUntil, useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "One workspace for AI-assisted email drafting, meeting notes analysis and task planning, with human review built into every step.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "AI-assisted emails, meeting intelligence and task planning — you stay in control.",
      },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  {
    to: "/email",
    title: "Smart Email Generator",
    description: "Draft a clear, workplace-appropriate email with tone, length and urgency control.",
    icon: Mail,
  },
  {
    to: "/meetings",
    title: "Meeting Notes Intelligence",
    description: "Turn raw notes into a summary, decisions, action items and deadlines.",
    icon: CalendarCheck,
  },
  {
    to: "/tasks",
    title: "AI Task Planner",
    description: "Prioritise your workload and generate a realistic daily or weekly schedule.",
    icon: ListTodo,
  },
] as const;

function Dashboard() {
  const { state, hydrated } = useAppStore();
  const tasks = state.tasks;
  const completed = tasks.filter((t) => t.status === "Completed");
  const open = tasks.filter((t) => t.status !== "Completed");
  const highPriority = open.filter((t) => t.priority === "High");
  const overdue = open.filter((t) => {
    const d = daysUntil(t.deadline);
    return d !== null && d < 0;
  });
  const upcoming = open.filter((t) => {
    const d = daysUntil(t.deadline);
    return d !== null && d >= 0 && d <= 7;
  });

  const minutesSaved =
    state.emailsGenerated * 8 + state.meetingsAnalysed * 20 + state.schedulesGenerated * 10;

  const stats = [
    { label: "Emails generated", value: state.emailsGenerated, icon: Mail },
    { label: "Meetings summarised", value: state.meetingsAnalysed, icon: CalendarCheck },
    { label: "Tasks planned", value: tasks.length, icon: ListTodo },
    { label: "Tasks completed", value: completed.length, icon: CheckCircle2 },
  ];

  const insights = [
    {
      label: "High-priority tasks open",
      value: highPriority.length,
      hint: highPriority[0］ = undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-primary px-6 py-8 text-primary-foreground shadow-[var(--shadow-card)] md:px-10 md:py-10">
        <Badge className="bg-accent text-accent-foreground">Human-in-the-loop AI</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome to your AI Workplace Productivity Assistant
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-foreground/85">
          Draft better emails, make sense of your meetings and plan your work — with AI that assists
          while you review, edit and approve every output.
        </p>
      </header>

      <section aria-labelledby="quick-actions" className="space-y-3">
        <h2 id="quick-actions" className="text-lg font-semibold">
          Quick actions
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {QUICK_ACTIONS.map(({ to, title, description, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="activity-stats" className="space-y-3">
        <h2 id="activity-stats" className="text-lg font-semibold">
          Activity statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="shadow-[var(--shadow-card)]">
              <CardContent className="flex items-center gap-4 py-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{hydrated ? value : "—"}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="insights" className="space-y-3">
        <h2 id="insights" className="text-lg font-semibold">
          Productivity insights
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Where your attention is needed</CardTitle>
              <CardDescription>Based on the tasks and meetings in this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InsightRow
                icon={<TrendingUp className="size-4" aria-hidden="true" />}
                label="High-priority tasks open"
                value={highPriority.length}
              />
              <InsightRow
                icon={<Clock className="size-4" aria-hidden="true" />}
                label="Deadlines in the next 7 days"
                value={upcoming.length}
              />
              <InsightRow
                icon={<AlertTriangle className="size-4" aria-hidden="true" />}
                label="Overdue tasks"
                value={overdue.length}
                tone={overdue.length > 0 ? "warn" : "default"}
              />
              <InsightRow
                icon={<ClipboardList className="size-4" aria-hidden="true" />}
                label="Action items extracted from meetings"
                value={state.actionItemsExtracted}
              />
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Estimated time saved</CardTitle>
              <CardDescription>
                Estimate only — based on typical drafting and note-writing times, not measured
                results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {hydrated ? `${Math.floor(minutesSaved / 60)}h ${minutesSaved % 60}m` : "—"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Estimate across {state.emailsGenerated} email draft(s), {state.meetingsAnalysed}{" "}
                meeting analysis/analyses and {state.schedulesGenerated} generated schedule(s).
              </p>
              {tasks.length === 0 && (
                <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  No activity yet — start with a quick action above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <ResponsibleAiNotice />
    </div>
  );
}

function InsightRow({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "warn";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
      <span className="flex items-center gap-2 text-foreground/80">
        <span className={tone === "warn" && value > 0 ? "text-destructive" : "text-primary"}>
          {icon}
        </span>
        {label}
      </span>
      <span
        className={`text-base font-semibold tabular-nums ${
          tone === "warn" && value > 0 ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
