import { daysUntil, type Task } from "../app-store";
import { plannerPrompt, type PromptSpec } from "./prompts";

export type Horizon = "Daily" | "Weekly";

export interface ScheduleItem {
  task: Task;
  hours: number;
}

export interface ScheduleBlock {
  label: string;
  items: ScheduleItem[];
  usedHours: number;
  capacityHours: number;
}

export interface PlanResult {
  blocks: ScheduleBlock[];
  urgent: Task[];
  overdue: Task[];
  reasoning: { taskId: string; name: string; why: string }[];
  unscheduled: Task[];
  totalPlannedHours: number;
  spec: PromptSpec;
}

const PRIORITY_WEIGHT: Record<Task["priority"], number> = { High: 300, Medium: 150, Low: 60 };

function score(task: Task) {
  const d = daysUntil(task.deadline);
  let s = PRIORITY_WEIGHT[task.priority];
  if (d === null) s -= 40;
  else if (d < 0) s += 500 + Math.min(200, Math.abs(d) * 20);
  else s += Math.max(0, 200 - d * 25);
  if (task.status === "In Progress") s += 45;
  if (task.durationHours <= 1) s += 10;
  return s;
}

function dayLabel(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export function buildPlan(tasks: Task[], horizon: Horizon, hoursPerDay: number): PlanResult {
  const open = tasks.filter((t) => t.status !== "Completed");
  const ranked = [...open].sort((a, b) => score(b) - score(a));

  const overdue = ranked.filter((t) => {
    const d = daysUntil(t.deadline);
    return d !== null && d < 0;
  });
  const urgent = ranked.filter((t) => {
    const d = daysUntil(t.deadline);
    return (d !== null && d >= 0 && d <= 2) || (t.priority === "High" && !overdue.includes(t));
  });

  const dayCount = horizon === "Daily" ? 1 : 5;
  const blocks: ScheduleBlock[] = Array.from({ length: dayCount }, (_, i) => ({
    label: dayLabel(i),
    items: [],
    usedHours: 0,
    capacityHours: hoursPerDay,
  }));

  const unscheduled: Task[] = [];
  for (const task of ranked) {
    const need = Math.max(0.5, Number(task.durationHours) || 1);
    const block = blocks.find((b) => b.capacityHours - b.usedHours >= Math.min(need, 1));
    if (!block) {
      unscheduled.push(task);
      continue;
    }
    const hours = Math.min(need, block.capacityHours - block.usedHours);
    block.items.push({ task, hours: Math.round(hours * 10) / 10 });
    block.usedHours = Math.round((block.usedHours + hours) * 10) / 10;
    if (hours < need) unscheduled.push(task);
  }

  const reasoning = ranked.slice(0, 5).map((t) => {
    const d = daysUntil(t.deadline);
    const bits: string[] = [];
    if (d !== null && d < 0) bits.push(`deadline passed ${Math.abs(d)} day(s) ago`);
    else if (d !== null && d <= 2) bits.push(`due in ${d} day(s)`);
    else if (d !== null) bits.push(`due in ${d} days`);
    else bits.push("no deadline supplied");
    bits.push(`${t.priority.toLowerCase()} priority`);
    bits.push(`${t.durationHours}h estimated`);
    if (t.status === "In Progress") bits.push("already in progress");
    return {
      taskId: t.id,
      name: t.name,
      why: `Scheduled early because it is ${bits.join(", ")}.`,
    };
  });

  return {
    blocks,
    urgent,
    overdue,
    reasoning,
    unscheduled,
    totalPlannedHours: Math.round(blocks.reduce((a, b) => a + b.usedHours, 0) * 10) / 10,
    spec: plannerPrompt({ horizon, hoursPerDay, taskCount: open.length }),
  };
}
