import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResponsibleAiNotice({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="responsible-ai-heading"
      className={cn(
        "rounded-2xl border border-secondary bg-secondary/60 p-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="responsible-ai-heading" className="text-sm font-semibold text-primary">
            Responsible AI use
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground/80">
            <li>AI-generated content can contain errors — always review and verify before use.</li>
            <li>
              Do not enter confidential, sensitive, private or personally identifiable information.
            </li>
            <li>
              AI assists; you review, edit, approve and take action. It never makes workplace
              decisions for you.
            </li>
            <li>Nothing is sent, scheduled or actioned automatically — including emails.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ReviewReminder({ children }: { children?: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-accent/40 bg-secondary/70 px-3 py-2 text-sm font-medium text-primary">
      {children ?? "Review and edit this draft before you send it. Nothing is sent automatically."}
    </p>
  );
}
