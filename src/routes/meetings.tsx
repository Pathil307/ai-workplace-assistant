import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Copy, ListPlus, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ResponsibleAiNotice, ReviewReminder } from "@/components/responsible-ai";
import {
  analyseMeeting,
  NOT_SPECIFIED,
  type ActionItem,
  type MeetingInput,
} from "@/lib/ai/meetings";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Intelligence — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into an editable summary, key decisions, action items and deadlines, and push action items straight into the task planner.",
      },
      { property: "og:title", content: "Meeting Notes Intelligence" },
      {
        property: "og:description",
        content: "Structure meeting notes into summary, decisions, action items and deadlines.",
      },
    ],
  }),
  component: MeetingsPage,
});

const EMPTY: MeetingInput = { title: "", date: "", participants: "", objective: "", notes: "" };

function MeetingsPage() {
  const { recordMeeting, addTask } = useAppStore();
  const [input, setInput] = useState<MeetingInput>(EMPTY);
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [deadlines, setDeadlines] = useState<{ item: string; date: string }[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [analysed, setAnalysed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof MeetingInput>(k: K, v: MeetingInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  const analyse = async () => {
    if (input.notes.trim().length < 15) {
      setError("Paste the meeting notes (at least a couple of lines) before analysing.");
      return;
    }
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    try {
      const result = analyseMeeting(input);
      setSummary(result.summary);
      setDecisions(result.decisions);
      setActionItems(result.actionItems);
      setDeadlines(result.deadlines);
      setAdded({});
      setAnalysed(true);
      recordMeeting({
        title: input.title || "Untitled meeting",
        date: input.date,
        actionItemCount: result.actionItems.length,
        decisionCount: result.decisions.length,
      });
      toast.success("Analysis ready — review and edit as needed.");
    } catch {
      setError("The notes could not be analysed. Try simplifying the formatting.");
    } finally {
      setLoading(false);
    }
  };

  const clearMeeting = () => {
    setInput(EMPTY);
    setSummary("");
    setDecisions([]);
    setActionItems([]);
    setDeadlines([]);
    setAnalysed(false);
    setError(null);
    toast("Meeting cleared");
  };

  const copyAll = async () => {
    const text = [
      `Meeting: ${input.title || NOT_SPECIFIED}`,
      `Date: ${input.date || NOT_SPECIFIED}`,
      "",
      "SUMMARY",
      summary,
      "",
      "KEY DECISIONS",
      ...(decisions.length ? decisions.map((d) => `- ${d}`) : ["- Not specified"]),
      "",
      "ACTION ITEMS",
      ...(actionItems.length
        ? actionItems.map((a) => `- ${a.task} | Responsible: ${a.owner} | Deadline: ${a.deadline}`)
        : ["- Not specified"]),
      "",
      "DEADLINES",
      ...(deadlines.length ? deadlines.map((d) => `- ${d.date}: ${d.item}`) : ["- Not specified"]),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Analysis copied to clipboard");
    } catch {
      toast.error("Copy failed — select the text and copy manually.");
    }
  };

  const updateItem = (id: string, patch: Partial<ActionItem>) =>
    setActionItems((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const sendToPlanner = (item: ActionItem) => {
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(item.deadline) ? item.deadline : "";
    addTask({
      name: item.task.slice(0, 140),
      description: `From meeting: ${input.title || "Untitled meeting"}${
        iso ? "" : item.deadline !== NOT_SPECIFIED ? ` — deadline noted as "${item.deadline}"` : ""
      }`,
      deadline: iso,
      durationHours: 1,
      priority: "Medium",
      status: "Not Started",
      owner: item.owner === NOT_SPECIFIED ? "" : item.owner,
      source: "meeting",
    });
    setAdded((a) => ({ ...a, [item.id]: true }));
    toast.success("Added to AI Task Planner");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-accent">Meeting Notes Intelligence</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Turn messy notes into structured outcomes
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Only content found in your notes is used. Missing owners or dates are shown as “Not
          specified” rather than guessed.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Meeting details</CardTitle>
            <CardDescription>Notes are required; everything else improves context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="m-title">Meeting title</Label>
                <Input
                  id="m-title"
                  value={input.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Weekly delivery sync"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-date">Date</Label>
                <Input
                  id="m-date"
                  type="date"
                  value={input.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-part">Participants</Label>
              <Input
                id="m-part"
                value={input.participants}
                onChange={(e) => set("participants", e.target.value)}
                placeholder="Comma separated, e.g. Thabo, Naledi, Sam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-obj">Objective</Label>
              <Input
                id="m-obj"
                value={input.objective}
                onChange={(e) => set("objective", e.target.value)}
                placeholder="Agree scope for the September release"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-notes">Raw meeting notes</Label>
              <Textarea
                id="m-notes"
                rows={12}
                value={input.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder={"Paste your notes here, one point per line."}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button className="min-h-11" onClick={analyse} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {loading ? "Analysing…" : "Analyse notes"}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11"
                onClick={analyse}
                disabled={loading || !analysed}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Regenerate analysis
              </Button>
              <Button variant="ghost" className="min-h-11" onClick={clearMeeting} disabled={loading}>
                <Trash2 className="size-4" aria-hidden="true" />
                Clear meeting
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {loading && (
            <Card className="shadow-[var(--shadow-card)]">
              <CardContent className="space-y-3 py-6" aria-live="polite">
                <div className="h-6 w-1/3 animate-pulse rounded-lg bg-muted" />
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
              </CardContent>
            </Card>
          )}

          {!loading && !analysed && (
            <Card className="shadow-[var(--shadow-card)]">
              <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <CalendarCheck className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">Nothing analysed yet</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Paste notes on the left and select Analyse notes to get a summary, decisions,
                  action items and deadlines.
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && analysed && (
            <>
              <ReviewReminder>
                Review this analysis before sharing it. The assistant extracts only what your notes
                contain.
              </ReviewReminder>

              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Meeting summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="summary" className="sr-only">
                    Meeting summary
                  </Label>
                  <Textarea
                    id="summary"
                    rows={5}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Key decisions</CardTitle>
                  <CardDescription>{decisions.length} recorded</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {decisions.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No explicit decisions found in the notes — {NOT_SPECIFIED}.
                    </p>
                  )}
                  {decisions.map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Label htmlFor={`decision-${i}`} className="sr-only">
                        Decision {i + 1}
                      </Label>
                      <Textarea
                        id={`decision-${i}`}
                        rows={2}
                        value={d}
                        onChange={(e) =>
                          setDecisions((list) =>
                            list.map((x, idx) => (idx === i ? e.target.value : x)),
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove decision ${i + 1}`}
                        className="min-h-11 min-w-11"
                        onClick={() => setDecisions((list) => list.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Action items</CardTitle>
                  <CardDescription>
                    {actionItems.length} extracted — edit, then add to the planner.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actionItems.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No action items found in the notes — {NOT_SPECIFIED}.
                    </p>
                  )}
                  {actionItems.map((item, i) => (
                    <div key={item.id} className="rounded-2xl border border-border p-4">
                      <Label htmlFor={`task-${item.id}`}>Task</Label>
                      <Textarea
                        id={`task-${item.id}`}
                        rows={2}
                        className="mt-1"
                        value={item.task}
                        onChange={(e) => updateItem(item.id, { task: e.target.value })}
                      />
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`owner-${item.id}`}>Responsible person</Label>
                          <Input
                            id={`owner-${item.id}`}
                            value={item.owner}
                            onChange={(e) => updateItem(item.id, { owner: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`due-${item.id}`}>Deadline</Label>
                          <Input
                            id={`due-${item.id}`}
                            value={item.deadline}
                            onChange={(e) => updateItem(item.id, { deadline: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant={added[item.id] ? "secondary" : "default"}
                          className="min-h-11"
                          onClick={() => sendToPlanner(item)}
                        >
                          <ListPlus className="size-4" aria-hidden="true" />
                          {added[item.id] ? "Add again to Task Planner" : "Add to Task Planner"}
                        </Button>
                        {added[item.id] && <Badge variant="secondary">Sent to planner</Badge>}
                        <Button
                          variant="ghost"
                          className="min-h-11"
                          onClick={() =>
                            setActionItems((list) => list.filter((_, idx) => idx !== i))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Deadlines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deadlines.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No dated commitments found — {NOT_SPECIFIED}.
                    </p>
                  )}
                  {deadlines.map((d, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2 text-sm"
                    >
                      <Badge className="bg-primary text-primary-foreground">{d.date}</Badge>
                      <span className="text-foreground/80">{d.item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="min-h-11" onClick={copyAll}>
                  <Copy className="size-4" aria-hidden="true" />
                  Copy analysis
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <ResponsibleAiNotice />
    </div>
  );
}
