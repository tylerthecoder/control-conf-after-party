"use client";

import { useState, useEffect, useCallback } from "react";

interface LeaderboardPlayer {
  _id: string;
  name: string;
  role: "player" | "monitor";
  score: number;
  sideTaskCompleted: boolean;
  sideTaskPendingVerification: boolean;
  sideTaskFailed: boolean;
  completedSideTasks: string[];
  mainTaskPendingVerification: boolean;
  completedMainTasks: string[];
  flagsRemaining: number;
  rank: number;
}

type ActivityType =
  | "side_task_completed"
  | "main_task_completed"
  | "flag_caught"
  | "flag_cleared";

interface Activity {
  _id: string;
  type: ActivityType;
  playerName: string;
  targetName: string | null;
  task: string | null;
  guess: string | null;
  reason: string | null;
  createdAt: string;
}

export default function LeaderboardPage() {
  const [all, setAll] = useState<LeaderboardPlayer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [feedUpdated, setFeedUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setAll(data.all);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/activity");
      const data = await res.json();
      setActivities(data.activities ?? []);
      setFeedUpdated(new Date());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Live standings
          </p>
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            Leaderboard.
          </h1>
          <p className="max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            Scores update every 10 seconds. The top three are highlighted; the
            full ranking is below.
          </p>
        </header>

        <div className="hr-rule my-10" />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_minmax(320px,400px)] lg:items-start">
          {/* LEFT: rankings */}
          <div className="space-y-12 min-w-0">
            {all.length >= 3 && (
              <Podium players={all.slice(0, 3)} />
            )}

            <section className="space-y-4">
              <SectionHeader
                title={all.length >= 3 ? "Full rankings" : "Rankings"}
                count={all.length}
              />

              {all.length === 0 ? (
                <p className="px-1 py-12 text-center text-sm text-muted-foreground">
                  Awaiting participants.
                </p>
              ) : (
                <ul className="divide-y divide-border/70 border-t border-b border-border/70">
                  {all.map((p, i) => (
                    <RankingRow key={p._id} player={p} rank={i + 1} />
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* RIGHT: live feed */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeader title="Recent activity" count={activities.length} />
            </div>
            <div className="border-t border-b border-border/70">
              {activities.length === 0 ? (
                <p className="px-1 py-10 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {activities.map((a) => (
                    <ActivityRow key={a._id} activity={a} />
                  ))}
                </ul>
              )}
            </div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Polling every 10s · last 20 events
              {feedUpdated && (
                <span className="ml-2 text-muted-foreground/50">
                  · synced {feedUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="font-serif text-xl tracking-tight text-foreground">
        {title}
      </h2>
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

function Podium({ players }: { players: LeaderboardPlayer[] }) {
  // order on screen: 2nd, 1st, 3rd
  const order = [1, 0, 2];
  return (
    <section className="grid grid-cols-3 gap-4 sm:gap-6">
      {order.map((podiumIndex) => {
        const p = players[podiumIndex];
        if (!p) return null;
        const rank = podiumIndex + 1;
        const elevated = rank === 1;

        return (
          <div
            key={p._id}
            className={`flex flex-col items-center text-center ${
              elevated ? "sm:-mt-3" : "sm:mt-2"
            }`}
          >
            <div
              className={`w-full border bg-card px-4 py-6 ${
                elevated
                  ? "border-brand/40 shadow-[0_1px_0_0_var(--border)]"
                  : "border-border"
              }`}
            >
              <p className="font-serif text-[13px] tracking-[0.04em] text-muted-foreground">
                {ordinal(rank)}
              </p>
              <p className="mt-3 truncate font-serif text-lg text-foreground">
                {p.name}
              </p>
              <p
                className={`mt-1 font-serif text-4xl tabular-nums ${
                  elevated ? "text-brand" : "text-foreground"
                }`}
              >
                {p.score}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
                <PlayerStatusInline player={p} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function RankingRow({
  player,
  rank,
}: {
  player: LeaderboardPlayer;
  rank: number;
}) {
  const isTop = rank <= 3;
  return (
    <li className="flex items-center gap-4 py-4">
      <span
        className={`w-8 shrink-0 text-right font-serif text-base tabular-nums ${
          isTop ? "text-brand" : "text-muted-foreground"
        }`}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <span className="truncate text-[15px] font-medium text-foreground">
            {player.name}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <PlayerStatusInline player={player} />
        </div>
      </div>
      <span className="font-serif text-2xl tabular-nums text-foreground">
        {player.score}
      </span>
    </li>
  );
}

function PlayerStatusInline({ player }: { player: LeaderboardPlayer }) {
  const taskCount =
    (player.completedSideTasks?.length ?? 0) +
    (player.completedMainTasks?.length ?? 0);
  const pending =
    player.sideTaskPendingVerification || player.mainTaskPendingVerification;
  const flagsUsed = 3 - (player.flagsRemaining ?? 3);

  const items: React.ReactNode[] = [];
  if (taskCount > 0) {
    items.push(
      <StatusPill key="tasks" tone="success">
        {taskCount} task{taskCount !== 1 ? "s" : ""}
      </StatusPill>
    );
  }
  if (pending) {
    items.push(
      <StatusPill key="pending" tone="warning">
        Pending
      </StatusPill>
    );
  }
  if (player.sideTaskFailed) {
    items.push(
      <StatusPill key="caught" tone="danger">
        Caught
      </StatusPill>
    );
  }
  if (flagsUsed > 0) {
    items.push(
      <StatusPill key="flags" tone="muted">
        {flagsUsed} flag{flagsUsed !== 1 ? "s" : ""}
      </StatusPill>
    );
  }
  return <>{items}</>;
}

function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "muted";
  children: React.ReactNode;
}) {
  const dot =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "danger"
          ? "bg-destructive"
          : "bg-muted-foreground/40";
  const text =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-foreground/70"
        : tone === "danger"
          ? "text-destructive"
          : "text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const time = new Date(activity.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const meta = (() => {
    switch (activity.type) {
      case "side_task_completed":
        return { label: "Side task", tone: "success" as const };
      case "main_task_completed":
        return { label: "Main task", tone: "success" as const };
      case "flag_caught":
        return { label: "Caught", tone: "warning" as const };
      case "flag_cleared":
        return { label: "Cleared", tone: "danger" as const };
    }
  })();

  return (
    <li className="px-1 py-3">
      <div className="mb-1 flex items-center gap-2">
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/70">
          {time}
        </span>
      </div>
      <ActivityBody activity={activity} />
    </li>
  );
}

function ActivityBody({ activity }: { activity: Activity }) {
  switch (activity.type) {
    case "side_task_completed":
      return (
        <p className="text-[14px] leading-snug text-foreground/85">
          <span className="font-medium text-foreground">
            {activity.playerName}
          </span>{" "}
          completed a side task
        </p>
      );
    case "main_task_completed":
      return (
        <p className="text-[14px] leading-snug text-foreground/85">
          <span className="font-medium text-foreground">
            {activity.playerName}
          </span>{" "}
          completed{" "}
          <span className="text-muted-foreground">
            {activity.task ?? "a main task"}
          </span>
        </p>
      );
    case "flag_caught":
      return (
        <p className="text-[14px] leading-snug text-foreground/85">
          <span className="font-medium text-foreground">
            {activity.playerName}
          </span>{" "}
          caught{" "}
          <span className="font-medium text-foreground">
            {activity.targetName}
          </span>
          {activity.guess === "(self-reported)" && (
            <span className="text-muted-foreground"> (self-reported)</span>
          )}
        </p>
      );
    case "flag_cleared":
      return (
        <p className="text-[14px] leading-snug text-foreground/85">
          <span className="font-medium text-foreground">
            {activity.playerName}
          </span>{" "}
          falsely flagged{" "}
          <span className="font-medium text-foreground">
            {activity.targetName}
          </span>
          {activity.guess && (
            <span className="text-muted-foreground">
              {" "}
              — &ldquo;{activity.guess}&rdquo;
            </span>
          )}
        </p>
      );
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
