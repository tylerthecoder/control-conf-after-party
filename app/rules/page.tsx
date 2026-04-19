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
            <p className="rounded-md border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-amber-200/90">
              <span className="font-medium text-amber-300">Important:</span> all tasks must be done with <span className="text-foreground font-medium">other players</span> only — not venue staff, not random guests, not your friends who didn&apos;t sign up. If a task says &ldquo;another player&rdquo; or &ldquo;other players,&rdquo; it means people who are actually playing the game.
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
              Think you know what someone&apos;s secret side task is? Flag them and <span className="text-foreground font-medium">describe what you think their task is</span>.
            </p>
            <p>
              The <span className="text-foreground font-medium">AI auditor</span> instantly compares your guess to their real task and delivers a verdict. If you&apos;re right, you get <span className="text-emerald-400 font-medium">+3</span> and they get <span className="text-destructive font-medium">-1</span> plus a new task.
            </p>
            <p>
              Players can also <span className="text-foreground font-medium">self-report</span> from their dashboard if someone catches them — they pick who caught them, and that person gets the +3 points.
            </p>
            <p>
              Choose wisely — wrong guesses cost you <span className="text-destructive font-medium">-2 points</span>.
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
