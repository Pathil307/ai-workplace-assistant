import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CalendarClock, ListTodo, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsibleAiNotice } from "@/components/responsible-ai";
import { buildPlan, type Horizon, type PlanResult } from "@/lib/ai/planner";
import { daysUntil, useAppStore, type Priority, type Status, type Task } from "@/lib/app-store";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Prioritise tasks by deadline, duration and priority, flag urgent and overdue work, and generate a readable daily or weekly schedule you approve.",
      },
      { property: "og:title", content: "AI Task Planner" },
      {
        property: "og:description",
        content: "Prioritised daily and weekly schedules built from your real task list.",
      },
    ],
  }),
  component: TasksPage,
});

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const STATUSES: Status[] = ["Not Started", "In Progress", "Completed"];

const priorityStyles: Record<Priority, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-secondary text-primary",
  Low: "bg-muted text-muted-foreground",
};

function TasksPage() {
  const { state, hydrated, addTask, updateTask, removeTask, recordSchedule } = useAppStore();
  const [horizon, setHorizon] = useState<Horizon>("Daily");
  const [hours, setHours] = useState(6);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [planning, setPlanning] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", deadline: "", durationHours: 1 });

  const tasks = state.tasks;

  const add = () => {
    if (!draft.name.trim()) {
      toast.error("Give the task a name first.");
      return;
    }
    addTask({
      name: draft.name.trim(),
      description: draft.description.trim(),
      deadline: draft.deadline,
      durationHours: Number(draft.durationHours) || 1,
      priority: "Medium",
      status: "Not Started",
      owner: "",
      source: "manual",
    });
    setDraft({ name: "", description: "", deadline: "", durationHours: 1 });
    setPlan(null);
    toast.success("Task added");
  };

  const generate = async () => {
    if (tasks.filter((t) => t.status !== "Completed").length === 0) {
      toast.error("Add at least one open task before generating a schedule.");
      return;
    }
    setPlanning(true);
    await new Promise((r) => setTimeout(r, 650));
    setPlan(buildPlan(tasks, horizon, hours));
    recordSchedule();
    setPlanning(false);
    toast.success("Schedule generated — adjust anything that doesn't fit.");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-accent">AI Task Planner</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Plan your day or week around real deadlines
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Recommendations are suggestions based on the deadlines, durations and priorities you
          enter. You stay in control of the final plan.
        </p>
      </header>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Add a task</CardTitle>
          <CardDescription>
            Action items sent from Meeting Notes Intelligence appear here automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="t-name">Task name</Label>
            <Input
              id="t-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Draft renewal summary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-deadline">Deadline</Label>
            <Input
              id="t-deadline"
              type="date"
              value={draft.deadline}
              onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-duration">Estimated hours</Label>
            <Input
              id="t-duration"
              type="number"
              min={0.5}
              step={0.5}
              value={draft.durationHours}
              onChange={(e) => setDraft({ ...draft, durationHours: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea
              id="t-desc"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button className="min-h-11 w-full" onClick={add}>
              <Plus className="size-4" aria-hidden="true" />
              Add task
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <CardTitle className="text-base">Your tasks</CardTitle>
            <CardDescription>{tasks.length} total</CardDescription>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="horizon">Planning window</Label>
              <Select value={horizon} onValueChange={(v) => setHorizon(v as Horizon)}>
                <SelectTrigger id="horizon" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="hours">Working hours / day</Label>
              <Input
                id="hours"
                type="number"
                min={1}
                max={12}
                step={0.5}
                className="w-32"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value) || 1)}
              />
            </div>
            <Button className="min-h-11" onClick={generate} disabled={planning}>
              {planning ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {plan ? "Regenerate schedule" : "Generate schedule"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hydrated && tasks.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <ListTodo className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No tasks yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Add a task above, or extract action items from a meeting to populate your planner.
              </p>
            </div>
          )}
          {!hydrated && <div className="h-24 animate-pulse rounded-2xl bg-muted" />}

          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onChange={(patch) => {
                updateTask(task.id, patch);
                setPlan(null);
              }}
              onRemove={() => {
                removeTask(task.id);
                setPlan(null);
              }}
            />
          ))}
        </CardContent>
      </Card>

      {plan && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              {horizon} schedule — {plan.totalPlannedHours}h planned
            </CardTitle>
            <CardDescription>
              Suggested order only. Review it against your calendar before committing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {(plan.overdue.length > 0 || plan.urgent.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {plan.overdue.length > 0 && (
                  <div className="rounded-2xl bg-destructive/10 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <AlertTriangle className="size-4" aria-hidden="true" /> Overdue (
                      {plan.overdue.length})
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-foreground/80">
                      {plan.overdue.map((t) => (
                        <li key={t.id}>{t.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {plan.urgent.length > 0 && (
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <CalendarClock className="size-4" aria-hidden="true" /> Urgent focus (
                      {plan.urgent.length})
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-foreground/80">
                      {plan.urgent.map((t) => (
                        <li key={t.id}>{t.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {plan.blocks.map((block) => (
                <div key={block.label} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{block.label}</p>
                    <span className="text-xs text-muted-foreground">
                      {block.usedHours}/{block.capacityHours}h
                    </span>
                  </div>
                  <ol className="mt-3 space-y-2">
                    {block.items.length === 0 && (
                      <li className="text-sm text-muted-foreground">No work scheduled.</li>
                    )}
                    {block.items.map((item, i) => (
                      <li key={item.task.id} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                          {i + 1}
                        </span>
                        <span>
                          <span className="font-medium">{item.task.name}</span>{" "}
                          <span className="text-muted-foreground">({item.hours}h)</span>
                          {item.task.owner && (
                            <span className="text-muted-foreground"> — {item.task.owner}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-semibold">Why this order</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {plan.reasoning.map((r) => (
                  <li key={r.taskId}>
                    <span className="font-medium text-foreground">{r.name}:</span> {r.why}
                  </li>
                ))}
              </ul>
            </div>

            {plan.unscheduled.length > 0 && (
              <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                {plan.unscheduled.length} task(s) did not fully fit in the available hours. Consider
                extending the window, reducing scope or renegotiating a deadline.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <ResponsibleAiNotice />
    </div>
  );
}

function TaskRow({
  task,
  onChange,
  onRemove,
}: {
  task: Task;
  onChange: (patch: Partial<Task>) => void;
  onRemove: () => void;
}) {
  const d = daysUntil(task.deadline);
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor={`name-${task.id}`} className="sr-only">
            Task name
          </Label>
          <Input
            id={`name-${task.id}`}
            value={task.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="font-medium"
          />
          <Label htmlFor={`desc-${task.id}`} className="sr-only">
            Task description
          </Label>
          <Textarea
            id={`desc-${task.id}`}
            rows={2}
            value={task.description}
            placeholder="Description"
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge className={priorityStyles[task.priority]}>{task.priority}</Badge>
          {task.source === "meeting" && <Badge variant="outline">From meeting</Badge>}
          {d !== null && d < 0 && task.status !== "Completed" && (
            <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            aria-label={`Remove task ${task.name}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label htmlFor={`deadline-${task.id}`}>Deadline</Label>
          <Input
            id={`deadline-${task.id}`}
            type="date"
            value={task.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`dur-${task.id}`}>Hours</Label>
          <Input
            id={`dur-${task.id}`}
            type="number"
            min={0.5}
            step={0.5}
            value={task.durationHours}
            onChange={(e) => onChange({ durationHours: Number(e.target.value) || 0.5 })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`prio-${task.id}`}>Priority</Label>
          <Select value={task.priority} onValueChange={(v) => onChange({ priority: v as Priority })}>
            <SelectTrigger id={`prio-${task.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`status-${task.id}`}>Status</Label>
          <Select value={task.status} onValueChange={(v) => onChange({ status: v as Status })}>
            <SelectTrigger id={`status-${task.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`owner-t-${task.id}`}>Responsible</Label>
          <Input
            id={`owner-t-${task.id}`}
            value={task.owner}
            placeholder="Not specified"
            onChange={(e) => onChange({ owner: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant={task.status === "Completed" ? "secondary" : "outline"}
          className="min-h-11"
          onClick={() =>
            onChange({ status: task.status === "Completed" ? "In Progress" : "Completed" })
          }
        >
          {task.status === "Completed" ? "Mark as in progress" : "Mark complete"}
        </Button>
        {d !== null && task.status !== "Completed" && (
          <span className="text-xs text-muted-foreground">
            {d < 0 ? `${Math.abs(d)} day(s) overdue` : d === 0 ? "Due today" : `Due in ${d} day(s)`}
          </span>
        )}
      </div>
    </div>
  );
}
