"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Player {
  _id: string;
  name: string;
  role: "player" | "monitor";
  mainTask: string | null;
  sideTask: string | null;
  sideTaskCompleted: boolean;
  sideTaskPendingVerification: boolean;
  score: number;
  flagsRemaining: number;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const [playersRes, statusRes] = await Promise.all([
      fetch("/api/players"),
      fetch("/api/game-status"),
    ]);
    setPlayers(await playersRes.json());
    const status = await statusRes.json();
    setGameActive(status.active);
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setError("Wrong password");
    }
  }

  async function handleStart() {
    setLoading(true);
    await fetch("/api/admin/start", { method: "POST" });
    await fetchData();
    setLoading(false);
  }

  async function handleReset() {
    if (!confirm("This will delete ALL players and flags. Are you sure?")) return;
    setLoading(true);
    await fetch("/api/admin/reset", { method: "POST" });
    await fetchData();
    setLoading(false);
  }

  if (!authed) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 grid-bg">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-6">
            <h1 className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase mb-2">
              Operator Access
            </h1>
            <p className="text-2xl font-bold">Admin Panel</p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoFocus
                className="h-11 bg-background/50 border-border/50"
              />
              {error && (
                <p className="text-sm text-destructive font-mono">{error}</p>
              )}
              <Button type="submit" className="w-full h-11">
                Authenticate
              </Button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 grid-bg">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Operator Panel
            </p>
            <h1 className="text-2xl font-bold mt-1">The Eval</h1>
          </div>
          <div className="flex items-center gap-3">
            {gameActive ? (
              <span className="font-mono text-xs text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                ACTIVE
              </span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                INACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          {!gameActive && (
            <Button
              onClick={handleStart}
              disabled={loading}
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              variant="outline"
            >
              Start the Eval
            </Button>
          )}
          <Button
            onClick={handleReset}
            disabled={loading}
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Reset Everything
          </Button>
          <Button onClick={fetchData} variant="outline" className="font-mono text-xs">
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-center">
            <p className="font-mono text-3xl font-bold tabular-nums">{players.length}</p>
            <p className="font-mono text-xs text-muted-foreground uppercase mt-1">Participants</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 text-center">
            <p className="font-mono text-3xl font-bold tabular-nums text-amber-400">
              {players.reduce((sum, p) => sum + (3 - p.flagsRemaining), 0)}
            </p>
            <p className="font-mono text-xs text-amber-400/60 uppercase mt-1">Flags Filed</p>
          </div>
        </div>

        {/* Participants Table */}
        <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
            <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Participants
            </h2>
            <span className="font-mono text-xs text-muted-foreground/60">{players.length}</span>
          </div>
          <div className="divide-y divide-border/30">
            {players.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">
                No participants yet
              </p>
            ) : (
              players.map((p) => (
                <div key={p._id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{p.name}</span>
                    {p.sideTaskCompleted && (
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald-500/30 text-emerald-400"
                      >
                        Task Done
                      </Badge>
                    )}
                    {p.sideTaskPendingVerification && (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-500/30 text-amber-400"
                      >
                        Pending
                      </Badge>
                    )}
                    <span className="font-mono text-xs text-amber-400/40">
                      {p.flagsRemaining} flags left
                    </span>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {p.score} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
