import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Loader2, Mail, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsibleAiNotice, ReviewReminder } from "@/components/responsible-ai";
import { generateEmail, type EmailInput, type Length, type Tone, type Urgency } from "@/lib/ai/email";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Draft workplace-appropriate emails with controllable tone, length and urgency. Every draft is editable and reviewed by you before sending.",
      },
      { property: "og:title", content: "Smart Email Generator" },
      {
        property: "og:description",
        content: "Generate editable, professional email drafts with tone, length and urgency controls.",
      },
    ],
  }),
  component: EmailPage,
});

const EMPTY: EmailInput = {
  purpose: "",
  recipient: "",
  keyInfo: "",
  tone: "Formal",
  length: "Medium",
  urgency: "Normal",
};

function EmailPage() {
  const { recordEmail } = useAppStore();
  const [input, setInput] = useState<EmailInput>(EMPTY);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [variant, setVariant] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const set = <K extends keyof EmailInput>(k: K, v: EmailInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  const run = async (nextVariant: number) => {
    if (!input.purpose.trim() || !input.keyInfo.trim()) {
      setError("Add the email purpose and the key information before generating a draft.");
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 650));
    try {
      const draft = generateEmail(input, nextVariant);
      setSubject(draft.subject);
      setBody(draft.body);
      setVariant(nextVariant);
      setGenerated(true);
      recordEmail({ subject: draft.subject, purpose: input.purpose });
      toast.success("Draft ready — please review before sending.");
    } catch {
      setError("The draft could not be generated. Adjust your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      toast.success("Email copied to clipboard");
    } catch {
      toast.error("Copy failed — select the text and copy manually.");
    }
  };

  const clear = () => {
    setInput(EMPTY);
    setSubject("");
    setBody("");
    setGenerated(false);
    setError(null);
    toast("Form cleared");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-accent">Smart Email Generator</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Draft a professional email in seconds
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The assistant uses only the details you supply — it never invents names, dates, facts or
          commitments.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Email brief</CardTitle>
            <CardDescription>All fields feed the prompt directly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of the email</Label>
              <Input
                id="purpose"
                placeholder="Request approval for the Q3 vendor renewal"
                value={input.purpose}
                onChange={(e) => set("purpose", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient role or type</Label>
              <Input
                id="recipient"
                placeholder="Finance Manager"
                value={input.recipient}
                onChange={(e) => set("recipient", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyinfo">Key information to include</Label>
              <Textarea
                id="keyinfo"
                rows={6}
                placeholder={"One point per line, e.g.\nRenewal window closes at month end\nCurrent contract covers 40 licences"}
                value={input.keyInfo}
                onChange={(e) => set("keyInfo", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={input.tone} onValueChange={(v) => set("tone", v as Tone)}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Formal", "Friendly", "Persuasive"].map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Select value={input.length} onValueChange={(v) => set("length", v as Length)}>
                  <SelectTrigger id="length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Short", "Medium", "Detailed"].map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={input.urgency} onValueChange={(v) => set("urgency", v as Urgency)}>
                  <SelectTrigger id="urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Normal", "Important", "Urgent"].map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => run(0)} disabled={loading} className="min-h-11">
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {loading ? "Generating…" : "Generate email"}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11"
                onClick={() => run(variant + 1)}
                disabled={loading || !generated}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Regenerate
              </Button>
              <Button variant="ghost" className="min-h-11" onClick={clear} disabled={loading}>
                <Trash2 className="size-4" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Editable draft</CardTitle>
            <CardDescription>Everything below is yours to edit before sending.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <div className="space-y-3" aria-live="polite">
                <div className="h-10 animate-pulse rounded-xl bg-muted" />
                <div className="h-64 animate-pulse rounded-xl bg-muted" />
              </div>
            )}

            {!loading && !generated && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                <Mail className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">No draft yet</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Fill in the brief and select Generate email to see an editable subject and body.
                </p>
              </div>
            )}

            {!loading && generated && (
              <>
                <ReviewReminder />
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Email body</Label>
                  <Textarea
                    id="body"
                    rows={18}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="font-normal leading-relaxed"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="min-h-11" onClick={copy}>
                    <Copy className="size-4" aria-hidden="true" />
                    Copy email
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => {
                      setSubject("");
                      setBody("");
                      setGenerated(false);
                    }}
                  >
                    Clear draft
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ResponsibleAiNotice />
    </div>
  );
}
