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
    if (!confirm("This will delete ALL players and flags. Are you sure?"))
      return;
    setLoading(true);
    await fetch("/api/admin/reset", { method: "POST" });
    await fetchData();
    setLoading(false);
  }

  if (!authed) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
          <header className="space-y-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Operator access
            </p>
            <h1 className="font-serif text-3xl tracking-tight text-foreground">
              Admin panel.
            </h1>
          </header>
          <form
            onSubmit={handleLogin}
            className="space-y-4 border border-border bg-card p-6"
          >
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Authenticate
            </Button>
          </form>
        </div>
      </main>
    );
  }

  const flagsFiled = players.reduce(
    (sum, p) => sum + (3 - p.flagsRemaining),
    0
  );

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-5xl space-y-10 px-5 py-12 sm:px-8 sm:py-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Operator panel
            </p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight text-foreground">
              PartyArena.
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {gameActive ? (
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Inactive
              </span>
            )}
          </div>
        </header>

        <div className="hr-rule" />

        {/* Controls */}
        <section className="flex flex-wrap gap-2">
          {!gameActive && (
            <Button onClick={handleStart} disabled={loading}>
              Start PartyArena
            </Button>
          )}
          <Button
            onClick={handleReset}
            disabled={loading}
            variant="outline"
            className="border-destructive/40 text-destructive hover:border-destructive"
          >
            Reset everything
          </Button>
          <Button onClick={fetchData} variant="ghost">
            Refresh
          </Button>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border">
          <Stat label="Participants" value={players.length} />
          <Stat label="Flags filed" value={flagsFiled} accent />
        </section>

        {/* Participants */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl tracking-tight text-foreground">
              Participants
            </h2>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {players.length}
            </span>
          </div>

          {players.length === 0 ? (
            <p className="border-t border-b border-border/70 py-10 text-center text-sm text-muted-foreground">
              No participants yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/70 border-t border-b border-border/70">
              {players.map((p) => (
                <li
                  key={p._id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-medium text-foreground">
                      {p.name}
                    </span>
                    {p.sideTaskCompleted && (
                      <Badge variant="success">Task done</Badge>
                    )}
                    {p.sideTaskPendingVerification && (
                      <Badge variant="warning">Pending</Badge>
                    )}
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {p.flagsRemaining} flags left
                    </span>
                  </div>
                  <span className="font-serif text-lg tabular-nums text-foreground">
                    {p.score}{" "}
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      pts
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-card p-6 text-center">
      <p
        className={`font-serif text-4xl tabular-nums ${
          accent ? "text-brand" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
