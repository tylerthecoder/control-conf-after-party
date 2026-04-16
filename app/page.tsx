"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gameActive, setGameActive] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/game-status")
      .then((r) => r.json())
      .then((data) => setGameActive(data.active))
      .catch(() => setGameActive(false));
  }, []);

  function getDeviceToken() {
    let token = localStorage.getItem("eval-device-token");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("eval-device-token", token);
    }
    return token;
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), deviceToken: getDeviceToken() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push("/play");
    } catch {
      setError("Failed to connect. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (gameActive === null) {
    return (
      <main className="flex-1 flex items-center justify-center grid-bg">
        <div className="font-mono text-sm text-muted-foreground animate-pulse-glow">
          INITIALIZING...
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4 grid-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md space-y-8 animate-fade-in-up">
        <div className="text-center space-y-3">
          <div className="inline-block">
            <p className="font-mono text-xs tracking-[0.3em] text-amber-500/70 uppercase mb-3">
              ControlConf 2026 After Party
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              The Eval
            </h1>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
          </div>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            A live AI control evaluation. Complete your task.
            Evade the monitors. Don&apos;t get caught.
          </p>
        </div>

        {gameActive ? (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
                className="h-14 text-lg bg-card/50 border-border/50 pl-4 pr-4 placeholder:text-muted-foreground/40 focus:border-amber-500/30 focus:ring-amber-500/10 transition-colors"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive font-mono">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium tracking-wide"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <span className="font-mono text-sm">AUTHENTICATING...</span>
              ) : (
                "Enter the Eval"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground/50 font-mono">
              <button onClick={() => router.push("/rules")} className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
                Read the rules
              </button>
            </p>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/30">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              <span className="font-mono text-sm text-muted-foreground">
                STANDBY
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              The eval hasn&apos;t started yet. Awaiting operator.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
