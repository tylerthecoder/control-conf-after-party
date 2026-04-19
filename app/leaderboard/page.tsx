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
    <main className="min-h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/20 overflow-hidden relative">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Header */}
        <header className="text-center space-y-3">
          <p className="font-mono text-xs tracking-[0.4em] text-amber-500/50 uppercase">
            ControlConf 2026 After Party
          </p>
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter">
            PARTYARENA
          </h1>
          <div className="flex items-center justify-center gap-3 text-zinc-500">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-zinc-700" />
            <span className="font-mono text-xs tracking-wider uppercase">
              Live Leaderboard
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-zinc-700" />
          </div>
        </header>

        {/* Two-column layout: rankings | live feed */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,420px)] gap-8 items-start">
          {/* LEFT: Rankings */}
          <div className="space-y-10 min-w-0">
            {/* Podium for top 3 */}
            {all.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[1, 0, 2].map((podiumIndex) => {
                  const p = all[podiumIndex];
                  if (!p) return null;
                  const rank = podiumIndex + 1;
                  const colors = {
                    1: { border: "border-amber-400/40", bg: "bg-amber-400/[0.06]", text: "text-amber-400", glow: "shadow-amber-400/10", label: "1ST" },
                    2: { border: "border-zinc-400/30", bg: "bg-zinc-400/[0.04]", text: "text-zinc-400", glow: "shadow-zinc-400/5", label: "2ND" },
                    3: { border: "border-amber-700/30", bg: "bg-amber-700/[0.04]", text: "text-amber-700", glow: "", label: "3RD" },
                  }[rank]!;

                  return (
                    <div
                      key={p._id}
                      className={`relative rounded-xl border ${colors.border} ${colors.bg} p-5 text-center ${rank === 1 ? "-mt-2 shadow-lg " + colors.glow : "mt-4"}`}
                    >
                      <span className={`font-mono text-xs ${colors.text} tracking-wider`}>
                        {colors.label}
                      </span>
                      <p className="text-xl font-bold mt-2 truncate">{p.name}</p>
                      <p className={`text-4xl font-bold tabular-nums mt-1 ${colors.text}`}>
                        {p.score}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-3">
                        {((p.completedSideTasks?.length ?? 0) + (p.completedMainTasks?.length ?? 0)) > 0 && <TaskCount count={(p.completedSideTasks?.length ?? 0) + (p.completedMainTasks?.length ?? 0)} />}
                        {(p.sideTaskPendingVerification || p.mainTaskPendingVerification) && <StatusDot color="amber" label="Pending" />}
                        {p.sideTaskFailed && <StatusDot color="red" label="Caught" />}
                        <FlagCount remaining={p.flagsRemaining} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full rankings list */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-mono text-xs tracking-wider text-zinc-500 uppercase">
                  {all.length >= 3 ? "Full Rankings" : "Rankings"}
                </h2>
                <div className="flex-1 h-px bg-zinc-800/50" />
                <span className="font-mono text-xs text-zinc-700">{all.length}</span>
              </div>

              <div className="space-y-1">
                {(all.length >= 3 ? all : []).map((p, i) => {
                  const rank = i + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <div
                      key={p._id}
                      className={`flex items-center justify-between py-3.5 px-5 rounded-lg transition-colors ${
                        isTop3
                          ? rank === 1
                            ? "bg-amber-400/[0.06] border border-amber-400/20"
                            : rank === 2
                              ? "bg-zinc-400/[0.03] border border-zinc-400/10"
                              : "bg-amber-700/[0.03] border border-amber-700/10"
                          : "bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`font-mono text-lg font-bold w-8 text-right tabular-nums ${
                          rank === 1 ? "text-amber-400" : rank === 2 ? "text-zinc-400" : rank === 3 ? "text-amber-700" : "text-zinc-600"
                        }`}>
                          {rank}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-medium">{p.name}</span>
                          <div className="flex items-center gap-1.5">
                            {((p.completedSideTasks?.length ?? 0) + (p.completedMainTasks?.length ?? 0)) > 0 && <TaskCount count={(p.completedSideTasks?.length ?? 0) + (p.completedMainTasks?.length ?? 0)} />}
                              {(p.sideTaskPendingVerification || p.mainTaskPendingVerification) && <StatusDot color="amber" label="Pending" />}
                              {p.sideTaskFailed && <StatusDot color="red" label="Caught" />}
                              <FlagCount remaining={p.flagsRemaining} />
                            </div>
                          </div>
                        </div>
                        <span className="text-2xl font-bold tabular-nums">
                          {p.score}
                        </span>
                      </div>
                    );
                  })}

                {/* When fewer than 3 players, show simple list */}
                {all.length > 0 && all.length < 3 && all.map((p, i) => {
                  const rank = i + 1;
                  return (
                    <div
                      key={p._id}
                      className={`flex items-center justify-between py-3.5 px-5 rounded-lg transition-colors ${
                        rank === 1
                          ? "bg-amber-400/[0.06] border border-amber-400/20"
                          : "bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`font-mono text-lg font-bold w-8 text-right tabular-nums ${
                          rank === 1 ? "text-amber-400" : "text-zinc-600"
                        }`}>
                          {rank}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-medium">{p.name}</span>
                          <div className="flex items-center gap-1.5">
                            {((p.completedSideTasks?.length ?? 0) + (p.completedMainTasks?.length ?? 0)) > 0 && <TaskCount count={(p.completedSideTasks?.length ?? 0) + (p.completedMainTasks?.length ?? 0)} />}
                            {(p.sideTaskPendingVerification || p.mainTaskPendingVerification) && <StatusDot color="amber" label="Pending" />}
                            {p.sideTaskFailed && <StatusDot color="red" label="Caught" />}
                            <FlagCount remaining={p.flagsRemaining} />
                          </div>
                        </div>
                      </div>
                      <span className="text-2xl font-bold tabular-nums">{p.score}</span>
                    </div>
                  );
                })}

                {all.length === 0 && (
                  <div className="text-center py-16">
                    <p className="font-mono text-sm text-zinc-700">AWAITING PARTICIPANTS</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: Live feed */}
          <aside className="lg:sticky lg:top-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <h2 className="font-mono text-xs tracking-wider text-zinc-500 uppercase">
                Live Feed
              </h2>
              <div className="flex-1 h-px bg-zinc-800/50" />
              <span className="font-mono text-[10px] text-zinc-700">
                {feedUpdated
                  ? feedUpdated.toLocaleTimeString().toUpperCase()
                  : "—"}
              </span>
            </div>

            <div className="rounded-xl border border-border/30 bg-white/[0.02] p-2 max-h-[75vh] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-mono text-xs text-zinc-700">
                    NO ACTIVITY YET
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {activities.map((a) => (
                    <ActivityRow key={a._id} activity={a} />
                  ))}
                </ul>
              )}
            </div>

          </aside>
        </div>
      </div>
    </main>
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
        return {
          color: "text-emerald-400",
          dot: "bg-emerald-400",
          label: "SIDE TASK",
        };
      case "main_task_completed":
        return {
          color: "text-emerald-300",
          dot: "bg-emerald-300",
          label: "MAIN TASK",
        };
      case "flag_caught":
        return {
          color: "text-amber-400",
          dot: "bg-amber-400",
          label: "CAUGHT",
        };
      case "flag_cleared":
        return {
          color: "text-red-400",
          dot: "bg-red-400",
          label: "CLEARED",
        };
    }
  })();

  return (
    <li className="rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} shadow-sm`} />
        <span
          className={`font-mono text-[10px] tracking-wider ${meta.color} uppercase`}
        >
          {meta.label}
        </span>
        <span className="ml-auto font-mono text-[10px] text-zinc-700 tabular-nums">
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
        <p className="text-sm text-zinc-300 leading-snug">
          <span className="font-semibold text-white">
            {activity.playerName}
          </span>{" "}
          completed a side task
          {activity.task && (
            <span className="text-zinc-500"> — &ldquo;{activity.task}&rdquo;</span>
          )}
        </p>
      );
    case "main_task_completed":
      return (
        <p className="text-sm text-zinc-300 leading-snug">
          <span className="font-semibold text-white">
            {activity.playerName}
          </span>{" "}
          completed{" "}
          <span className="text-zinc-400">
            {activity.task ?? "a main task"}
          </span>
        </p>
      );
    case "flag_caught":
      return (
        <div className="space-y-1">
          <p className="text-sm text-zinc-300 leading-snug">
            <span className="font-semibold text-white">
              {activity.playerName}
            </span>{" "}
            caught{" "}
            <span className="font-semibold text-white">
              {activity.targetName}
            </span>
            {activity.guess && activity.guess !== "(self-reported)" && (
              <span className="text-zinc-500">
                {" "}
                — &ldquo;{activity.guess}&rdquo;
              </span>
            )}
            {activity.guess === "(self-reported)" && (
              <span className="text-zinc-500"> (self-reported)</span>
            )}
          </p>
          {activity.reason && (
            <p className="text-xs text-zinc-500 italic leading-snug">
              {activity.reason}
            </p>
          )}
        </div>
      );
    case "flag_cleared":
      return (
        <div className="space-y-1">
          <p className="text-sm text-zinc-300 leading-snug">
            <span className="font-semibold text-white">
              {activity.playerName}
            </span>{" "}
            falsely flagged{" "}
            <span className="font-semibold text-white">
              {activity.targetName}
            </span>
            {activity.guess && (
              <span className="text-zinc-500">
                {" "}
                — &ldquo;{activity.guess}&rdquo;
              </span>
            )}
          </p>
          {activity.reason && (
            <p className="text-xs text-zinc-500 italic leading-snug">
              {activity.reason}
            </p>
          )}
        </div>
      );
  }
}

function StatusDot({ color, label }: { color: "emerald" | "red" | "amber"; label: string }) {
  const colorMap = {
    emerald: "bg-emerald-400 shadow-emerald-400/50",
    red: "bg-red-400 shadow-red-400/50",
    amber: "bg-amber-400 shadow-amber-400/50",
  };
  const textMap = {
    emerald: "text-emerald-400/60",
    red: "text-red-400/60",
    amber: "text-amber-400/60",
  };

  return (
    <span className={`font-mono text-[10px] tracking-wider ${textMap[color]} flex items-center gap-1`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colorMap[color]} shadow-sm`} />
      {label.toUpperCase()}
    </span>
  );
}

function FlagCount({ remaining }: { remaining: number }) {
  const used = 3 - remaining;
  if (used === 0) return null;
  return (
    <span className="font-mono text-[10px] tracking-wider text-zinc-600 flex items-center gap-1">
      {used} flag{used !== 1 ? "s" : ""}
    </span>
  );
}

function TaskCount({ count }: { count: number }) {
  return (
    <span className="font-mono text-[10px] tracking-wider text-emerald-400/60 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
      {count} task{count !== 1 ? "s" : ""}
    </span>
  );
}
