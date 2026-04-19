"use client";

import Link from "next/link";

export default function RulesPage() {
  return (
    <main className="flex-1">
      <article className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-8 sm:py-20">
        <header className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            How to play
          </p>
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            Rules of PartyArena.
          </h1>
          <p className="text-[17px] leading-relaxed text-muted-foreground">
            Every player is given a secret task. Every player is also a monitor.
            Score points by getting your task verified, or by catching others
            doing theirs.
          </p>
        </header>

        <div className="hr-rule my-10" />

        <Section title="How it works">
          <p>
            Every player gets a{" "}
            <span className="font-medium text-foreground">side task</span> — a
            secret, sneaky objective worth points when verified by another
            player.
          </p>
          <p>
            Complete your task, then ask another player to scan your QR code
            and confirm they witnessed it. You&apos;ll get a new task after
            each one.
          </p>
          <Callout label="Important">
            All tasks must be done with{" "}
            <span className="font-medium text-foreground">other players</span>{" "}
            only — not venue staff, not random guests, not your friends who
            didn&apos;t sign up. If a task says &ldquo;another player&rdquo; or
            &ldquo;other players,&rdquo; it means people who are actually
            playing the game.
          </Callout>
          <p>
            Everyone is also a{" "}
            <span className="font-medium text-foreground">monitor</span> — you
            can flag other players if you think they&apos;re doing something
            suspicious. An AI auditor will judge whether the flag is valid.
          </p>
        </Section>

        <Section title="Scoring">
          <ul className="-mt-2 divide-y divide-border/70">
            <ScoreRow tone="positive" points="+5" label="Side task verified by another player" />
            <ScoreRow tone="positive" points="+3" label="You correctly flag someone (they get caught)" />
            <ScoreRow tone="negative" points="−1" label="You get caught doing your side task" />
            <ScoreRow tone="negative" points="−2" label="You file a false flag (target is cleared)" />
          </ul>
        </Section>

        <Section title="Task flow">
          <ol className="-mt-1 space-y-3">
            <Step n={1} text="Complete your side task (+5)." />
            <Step n={2} text='Tap "Request Verification" on your dashboard.' />
            <Step n={3} text="Show the QR code to someone who witnessed it." />
            <Step n={4} text="They scan and confirm — you earn points." />
            <Step n={5} text="You get a new task. Repeat." />
          </ol>
        </Section>

        <Section title="Flagging">
          <p>
            Think you know what someone&apos;s secret side task is? Flag them
            and{" "}
            <span className="font-medium text-foreground">
              describe what you think their task is
            </span>
            .
          </p>
          <p>
            The{" "}
            <span className="font-medium text-foreground">AI auditor</span>{" "}
            instantly compares your guess to their real task and delivers a
            verdict. If you&apos;re right, you get{" "}
            <span className="font-medium text-success">+3</span> and they get{" "}
            <span className="font-medium text-destructive">−1</span> plus a new
            task.
          </p>
          <p>
            Players can also{" "}
            <span className="font-medium text-foreground">self-report</span>{" "}
            from their dashboard if someone catches them — they pick who caught
            them, and that person gets the +3 points.
          </p>
          <p>
            Choose wisely — wrong guesses cost you{" "}
            <span className="font-medium text-destructive">−2 points</span>.
          </p>
        </Section>

        <div className="hr-rule my-10" />

        <div className="flex items-center justify-between text-sm">
          <Link
            href="/play"
            className="text-brand underline-offset-4 hover:underline"
          >
            ← Back to dashboard
          </Link>
          <Link
            href="/leaderboard"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View leaderboard
          </Link>
        </div>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 space-y-4">
      <h2 className="font-serif text-2xl tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-4 text-[15.5px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function Callout({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-brand bg-brand/5 px-4 py-3 text-foreground/90">
      <span className="mr-1 font-medium text-brand">{label}:</span>
      <span className="text-foreground/85">{children}</span>
    </div>
  );
}

function ScoreRow({
  tone,
  points,
  label,
}: {
  tone: "positive" | "negative";
  points: string;
  label: string;
}) {
  const color =
    tone === "positive" ? "text-success" : "text-destructive";
  return (
    <li className="flex items-center justify-between gap-6 py-3">
      <span className="text-[15px] text-foreground">{label}</span>
      <span className={`font-mono text-base tabular-nums ${color}`}>
        {points}
      </span>
    </li>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-baseline gap-4">
      <span className="font-serif text-lg tabular-nums text-brand">{n}.</span>
      <span className="text-[15.5px] leading-relaxed text-muted-foreground">
        {text}
      </span>
    </li>
  );
}
