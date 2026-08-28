import { emailPrompt, type PromptSpec } from "./prompts";

export type Tone = "Formal" | "Friendly" | "Persuasive";
export type Length = "Short" | "Medium" | "Detailed";
export type Urgency = "Normal" | "Important" | "Urgent";

export interface EmailInput {
  purpose: string;
  recipient: string;
  keyInfo: string;
  tone: Tone;
  length: Length;
  urgency: Urgency;
}

export interface EmailDraft {
  subject: string;
  body: string;
  spec: PromptSpec;
}

const openers: Record<Tone, string> = {
  Formal: "I hope this message finds you well.",
  Friendly: "Hope you're having a good week.",
  Persuasive: "I wanted to bring something to your attention that I believe is worth your time.",
};

const closings: Record<Tone, string> = {
  Formal: "Kind regards",
  Friendly: "Thanks so much",
  Persuasive: "Looking forward to your thoughts",
};

const urgencyLine: Record<Urgency, string> = {
  Normal: "",
  Important: "Please treat this as important when planning your week.",
  Urgent: "This is time-sensitive, so an early response would be very helpful.",
};

function greetingFor(recipient: string, tone: Tone) {
  const who = recipient.trim();
  if (!who) return tone === "Friendly" ? "Hi there," : "Dear colleague,";
  if (tone === "Friendly") return `Hi ${who},`;
  return `Dear ${who},`;
}

function bulletise(keyInfo: string) {
  return keyInfo
    .split(/\n|(?<=\.)\s+(?=[A-Z])/)
    .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function subjectFor(input: EmailInput) {
  const core = input.purpose.trim().replace(/\.$/, "");
  const base = core ? core.charAt(0).toUpperCase() + core.slice(1) : "Follow-up";
  const prefix = input.urgency === "Urgent" ? "Urgent: " : input.urgency === "Important" ? "Action needed: " : "";
  return `${prefix}${base}`.slice(0, 120);
}

/** Deterministic drafting service. Uses only the supplied inputs — no invented facts. */
export function generateEmail(input: EmailInput, variant = 0): EmailDraft {
  const spec = emailPrompt({ ...input, variant });
  const points = bulletise(input.keyInfo);
  const greeting = greetingFor(input.recipient, input.tone);
  const paragraphs: string[] = [];

  const purpose = input.purpose.trim() || "share an update";
  const intros = [
    `${openers[input.tone]} I'm writing to ${purpose.replace(/^to\s+/i, "")}.`,
    `I'm reaching out regarding ${purpose.replace(/^to\s+/i, "")}. ${openers[input.tone]}`,
  ];
  paragraphs.push(intros[variant % intros.length] ?? intros[0]!);

  if (points.length > 1 && input.length !== "Short") {
    paragraphs.push(
      "Here are the key points:\n" + points.map((p) => `• ${p.replace(/\.$/, "")}`).join("\n"),
    );
  } else if (points.length) {
    paragraphs.push(points.join(" "));
  }

  if (input.length === "Detailed") {
    paragraphs.push(
      "If any of the above needs clarification, I'm happy to walk through the detail or share the underlying context in a short call. Please let me know what works best for you.",
    );
  }

  if (urgencyLine[input.urgency]) paragraphs.push(urgencyLine[input.urgency]);

  paragraphs.push(
    input.tone === "Persuasive"
      ? "I'd welcome your view on the next step so we can move this forward together."
      : "Please let me know if you have any questions or would like anything adjusted.",
  );

  const body = [greeting, "", ...paragraphs.join("\n\n").split("\n"), "", `${closings[input.tone]},`, "[Your name]"].join("\n");

  return { subject: subjectFor(input), body, spec };
}
