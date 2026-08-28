/**
 * Isolated prompt layer.
 *
 * Every AI feature is described here as a structured prompt spec
 * (role / task / userInput / format / constraints) so prompts can be
 * refined in one place without touching UI code. The service layer
 * (email.ts, meetings.ts, planner.ts) consumes these specs; when a live
 * model provider is connected, the same specs are what gets sent.
 */

export interface PromptSpec {
  id: string;
  role: string;
  task: string;
  userInput: Record<string, unknown>;
  format: string;
  constraints: string[];
}

const SHARED_CONSTRAINTS = [
  "Never invent names, dates, numbers, facts, commitments or context that are not present in the user input.",
  "If a required detail is missing, write \"Not specified\" instead of guessing.",
  "Never send, schedule or action anything automatically; output is a draft for human review.",
  "Do not include confidential, sensitive or personally identifiable information beyond what the user supplied.",
  "Use neutral, professional, workplace-appropriate language.",
];

export function emailPrompt(input: Record<string, unknown>): PromptSpec {
  return {
    id: "smart-email-generator",
    role: "You are a professional workplace communication assistant supporting an employee drafting internal and external business email.",
    task: "Draft one email subject line and one email body based strictly on the supplied purpose, recipient, key information, tone, length and urgency.",
    userInput: input,
    format:
      "Return JSON: { subject: string, greeting: string, paragraphs: string[], closing: string }.",
    constraints: [
      ...SHARED_CONSTRAINTS,
      "Do not promise deadlines, budgets or approvals that the user did not state.",
      "Match the requested tone and length exactly; urgency changes phrasing, never adds fake escalation reasons.",
    ],
  };
}

export function meetingPrompt(input: Record<string, unknown>): PromptSpec {
  return {
    id: "meeting-notes-intelligence",
    role: "You are a meeting analyst that structures raw, messy meeting notes for a professional team.",
    task: "Extract a concise summary, key decisions, action items and deadlines from the supplied notes only.",
    userInput: input,
    format:
      'Return JSON: { summary: string, decisions: string[], actionItems: [{ task: string, owner: string, deadline: string }], deadlines: [{ item: string, date: string }] }. Use "Not specified" for any missing owner or deadline.',
    constraints: [
      ...SHARED_CONSTRAINTS,
      "Only attribute an action item to a person if that person is named in the notes or participant list.",
      "Never convert a discussion point into a decision unless the notes state it was decided or agreed.",
    ],
  };
}

export function plannerPrompt(input: Record<string, unknown>): PromptSpec {
  return {
    id: "ai-task-planner",
    role: "You are a pragmatic productivity planner helping a professional sequence their real workload.",
    task: "Prioritise the supplied tasks using deadlines, estimated duration, priority and status, then propose a realistic daily or weekly schedule within the available working hours.",
    userInput: input,
    format:
      "Return JSON: { blocks: [{ label: string, items: [{ taskId: string, hours: number }] }], urgent: string[], overdue: string[], reasoning: [{ taskId: string, why: string }], unscheduled: string[] }.",
    constraints: [
      ...SHARED_CONSTRAINTS,
      "Never exceed the stated available working hours per day.",
      "Never move or invent a deadline; flag conflicts instead.",
      "Recommendations are suggestions for the user to approve, not decisions.",
    ],
  };
}
