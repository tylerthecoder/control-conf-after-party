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
  flagsRemaining: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [all, setAll] = useState<LeaderboardPlayer[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setAll(data.all);
      setLastUpdated(new Date());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

      <div className="relative max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* Header */}
        <header className="text-center space-y-3">
          <p className="font-mono text-xs tracking-[0.4em] text-amber-500/50 uppercase">
            ControlConf 2026 After Party
          </p>
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter">
            THE EVAL
          </h1>
          <div className="flex items-center justify-center gap-3 text-zinc-500">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-zinc-700" />
            <span className="font-mono text-xs tracking-wider uppercase">
              Live Leaderboard
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-zinc-700" />
          </div>
          {lastUpdated && (
            <p className="font-mono text-[10px] text-zinc-700 tracking-wider">
              LAST SYNC {lastUpdated.toLocaleTimeString().toUpperCase()}
            </p>
          )}
        </header>

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
                    {p.sideTaskCompleted && <StatusDot color="emerald" label="Done" />}
                    {p.sideTaskPendingVerification && <StatusDot color="amber" label="Pending" />}
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
                        {p.sideTaskCompleted && <StatusDot color="emerald" label="Done" />}
                        {p.sideTaskPendingVerification && <StatusDot color="amber" label="Pending" />}
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
                        {p.sideTaskCompleted && <StatusDot color="emerald" label="Done" />}
                        {p.sideTaskPendingVerification && <StatusDot color="amber" label="Pending" />}
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

        {/* Scoring legend */}
        <div className="max-w-xs mx-auto rounded-xl border border-border/30 bg-white/[0.02] p-4 space-y-2.5">
          <p className="font-mono text-[10px] text-zinc-600 tracking-wider uppercase text-center">
            Scoring
          </p>
          <div className="space-y-1.5 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>Side task verified</span>
              <span className="font-mono text-emerald-500/70">+1</span>
            </div>
            <div className="flex justify-between">
              <span>Correct flag (caught)</span>
              <span className="font-mono text-amber-500/70">+3</span>
            </div>
            <div className="flex justify-between">
              <span>False flag (cleared)</span>
              <span className="font-mono text-red-500/70">-2</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
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
