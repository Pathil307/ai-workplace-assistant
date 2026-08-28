import { meetingPrompt, type PromptSpec } from "./prompts";

export interface MeetingInput {
  title: string;
  date: string;
  participants: string;
  objective: string;
  notes: string;
}

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  deadline: string;
}

export interface DeadlineItem {
  item: string;
  date: string;
}

export interface MeetingAnalysis {
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  deadlines: DeadlineItem[];
  spec: PromptSpec;
}

export const NOT_SPECIFIED = "Not specified";

const DECISION_HINTS = /\b(decided|agreed|approved|confirmed|signed off|resolved|conclusion)\b/i;
const ACTION_HINTS =
  /\b(will|to do|action|assign|owner|responsible|follow up|follow-up|prepare|send|draft|review|deliver|schedule|update|share|investigate)\b/i;

const DATE_PATTERNS = [
  /\bby\s+([A-Z][a-z]+day)\b/,
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
  /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\b/i,
  /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2})\b/i,
  /\b(end of (?:day|week|month|the sprint|the quarter))\b/i,
  /\b(next week|this week|tomorrow|end of play)\b/i,
];

function findDate(line: string): string {
  for (const re of DATE_PATTERNS) {
    const m = line.match(re);
    if (m && m[1]) return m[1];
  }
  return NOT_SPECIFIED;
}

function findOwner(line: string, participants: string[]): string {
  const explicit = line.match(/\b(?:owner|responsible|assigned to)\s*[:\-]\s*([A-Za-z .'-]{2,40})/i);
  if (explicit && explicit[1]) return explicit[1].trim();
  for (const p of participants) {
    const first = p.split(/\s+/)[0];
    if (!first || first.length < 2) continue;
    if (new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(line)) return p;
  }
  return NOT_SPECIFIED;
}

function cleanLine(line: string) {
  return line.replace(/^[-•*\d.)\s]+/, "").trim();
}

let counter = 0;
const nextId = () => `ai-${Date.now().toString(36)}-${counter++}`;

/** Deterministic extraction. Only content present in the notes is used. */
export function analyseMeeting(input: MeetingInput): MeetingAnalysis {
  const spec = meetingPrompt(input);
  const participants = input.participants
    .split(/[,\n;]/)
    .map((p) => p.trim())
    .filter(Boolean);

  const lines = input.notes
    .split(/\n|(?<=\.)\s+(?=[A-Z])/)
    .map(cleanLine)
    .filter((l) => l.length > 2);

  const decisions: string[] = [];
  const actionItems: ActionItem[] = [];
  const deadlines: DeadlineItem[] = [];
  const others: string[] = [];

  for (const line of lines) {
    if (DECISION_HINTS.test(line)) {
      decisions.push(line);
      continue;
    }
    if (ACTION_HINTS.test(line)) {
      const deadline = findDate(line);
      actionItems.push({
        id: nextId(),
        task: line,
        owner: findOwner(line, participants),
        deadline,
      });
      if (deadline !== NOT_SPECIFIED) deadlines.push({ item: line, date: deadline });
      continue;
    }
    const d = findDate(line);
    if (d !== NOT_SPECIFIED) deadlines.push({ item: line, date: d });
    others.push(line);
  }

  const summaryParts: string[] = [];
  const heading = [input.title.trim(), input.date.trim()].filter(Boolean).join(" — ");
  if (heading) summaryParts.push(`${heading}.`);
  if (participants.length) summaryParts.push(`Participants: ${participants.join(", ")}.`);
  if (input.objective.trim()) summaryParts.push(`Objective: ${input.objective.trim()}.`);
  summaryParts.push(
    `The notes contain ${decisions.length} recorded decision${decisions.length === 1 ? "" : "s"}, ${actionItems.length} action item${actionItems.length === 1 ? "" : "s"} and ${deadlines.length} dated commitment${deadlines.length === 1 ? "" : "s"}.`,
  );
  if (others.length) summaryParts.push(`Discussion points captured: ${others.slice(0, 4).join("; ")}.`);

  return { summary: summaryParts.join(" "), decisions, actionItems, deadlines, spec };
}
