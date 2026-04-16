"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RulesPage() {
  const router = useRouter();

  return (
    <main className="flex-1 grid-bg">
      <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-3xl font-bold tracking-tight">Rules</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="font-mono text-xs"
          >
            Back
          </Button>
        </div>

        {/* Overview */}
        <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30">
            <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">How It Works</h2>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Every player gets a <span className="text-foreground font-medium">main task</span> (public, social) and a <span className="text-foreground font-medium">side task</span> (secret, sneaky). Both are worth points when verified by another player.
            </p>
            <p>
              Complete a task, then ask another player to scan your QR code and confirm they witnessed it. You&apos;ll get a new task after each one.
            </p>
            <p>
              Everyone is also a <span className="text-amber-400 font-medium">monitor</span> — you can flag other players if you think they&apos;re doing something suspicious. An AI auditor will judge whether the flag is valid.
            </p>
          </div>
        </section>

        {/* Scoring */}
        <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30">
            <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">Scoring</h2>
          </div>
          <div className="px-5 py-4">
            <div className="space-y-3">
              <ScoreRow color="emerald" points="+5" label="Side task (secret) verified by another player" />
              <ScoreRow color="emerald" points="+1" label="Main task verified by another player" />
              <ScoreRow color="emerald" points="+3" label="You correctly flag someone (they get caught)" />
              <ScoreRow color="red" points="-1" label="You get caught doing your side task" />
              <ScoreRow color="red" points="-2" label="You file a false flag (target is cleared)" />
            </div>
          </div>
        </section>

        {/* Flow */}
        <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30">
            <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">Task Flow</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <Step n={1} text="Complete your main task (+1) or side task (+5)" />
            <Step n={2} text='Tap "Request Verification" on your dashboard' />
            <Step n={3} text="Show the QR code to someone who witnessed it" />
            <Step n={4} text="They scan and confirm — you earn points" />
            <Step n={5} text="You get a new task. Repeat!" />
          </div>
        </section>

        {/* Flagging */}
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-500/10">
            <h2 className="font-mono text-xs tracking-wider text-amber-400/80 uppercase">Flagging</h2>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              You have <span className="text-amber-400 font-medium">3 flags</span> to use. If you see someone acting suspicious, file a report describing what you saw.
            </p>
            <p>
              The flagged player gets a chance to defend themselves. Then an <span className="text-foreground font-medium">AI auditor</span> reviews the evidence and makes a ruling.
            </p>
            <p>
              Choose wisely — false flags cost you <span className="text-destructive font-medium">-2 points</span>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ScoreRow({ color, points, label }: { color: "emerald" | "red"; points: string; label: string }) {
  const colorClasses = color === "emerald"
    ? "text-emerald-400 bg-emerald-400/10 border-emerald-500/20"
    : "text-destructive bg-destructive/10 border-destructive/20";

  return (
    <div className="flex items-center gap-3">
      <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${colorClasses} min-w-[3rem] text-center`}>
        {points}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-mono text-xs text-muted-foreground/40 mt-0.5 shrink-0 w-5 text-right">
        {n}.
      </span>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
