"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
        body: JSON.stringify({
          name: name.trim(),
          deviceToken: getDeviceToken(),
        }),
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
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 paper-bg">
      <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="space-y-12 animate-fade-in-up">
          <header className="space-y-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              ControlConf 2026 · After Party
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              The Eval.
            </h1>
            <p className="max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              A live evaluation game. You&apos;re given a secret task. Complete
              it without other players noticing. Catch theirs before they catch
              yours.
            </p>
          </header>

          <div className="hr-rule" />

          {gameActive ? (
            <form onSubmit={handleJoin} className="max-w-md space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Your name
                </label>
                <Input
                  id="name"
                  placeholder="As others will see you"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="h-12 text-base"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !name.trim()}
                  className="px-6"
                >
                  {loading ? "Logging in…" : "Login →"}
                </Button>
                <Link
                  href="/rules"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Read the rules
                </Link>
              </div>
            </form>
          ) : (
            <div className="max-w-md space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                Standby
              </div>
              <p className="text-base text-muted-foreground">
                The eval hasn&apos;t started yet. Awaiting the operator.
              </p>
              <Link
                href="/rules"
                className="text-sm text-brand underline-offset-4 hover:underline"
              >
                Read the rules while you wait →
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
