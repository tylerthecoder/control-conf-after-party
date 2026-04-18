"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Player {
  _id: string;
  name: string;
  role: string;
}

interface FlagResult {
  verdict: "caught" | "cleared";
  reason: string;
}

function FlagForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledTarget = searchParams.get("target");

  const [players, setPlayers] = useState<Player[]>([]);
  const [targetId, setTargetId] = useState(prefilledTarget || "");
  const [search, setSearch] = useState("");
  const [guess, setGuess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FlagResult | null>(null);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => {});
  }, []);

  const targetName = players.find((p) => p._id === targetId)?.name;

  const normalizedSearch = search.trim().toLowerCase();
  const filteredPlayers = normalizedSearch
    ? players.filter((p) => p.name.toLowerCase().includes(normalizedSearch))
    : players;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, guess }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult({ verdict: data.verdict, reason: data.reason });
    } catch {
      setError("Failed to submit flag");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const isCaught = result.verdict === "caught";
    return (
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className={`rounded-xl border overflow-hidden ${isCaught ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-destructive/30 bg-destructive/[0.03]"}`}>
          <div className={`px-6 py-4 border-b ${isCaught ? "border-emerald-500/15" : "border-destructive/15"}`}>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs tracking-wider uppercase ${isCaught ? "text-emerald-400" : "text-destructive"}`}>
                {isCaught ? "CAUGHT" : "CLEARED"}
              </span>
              <span className={`font-mono text-sm font-bold ${isCaught ? "text-emerald-400" : "text-destructive"}`}>
                {isCaught ? "+3" : "-2"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isCaught
                ? `You correctly identified ${targetName ?? "their"}'s side task!`
                : `Your guess about ${targetName ?? "them"} was wrong.`}
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-background/50 border border-border/30 p-4">
              <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2">
                AI Auditor&apos;s Ruling
              </p>
              <p className="text-[15px] leading-relaxed italic">{result.reason}</p>
            </div>
            <Button onClick={() => router.push("/play")} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg animate-fade-in-up">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/play")}
          className="text-muted-foreground text-xs font-mono -ml-2"
        >
          &larr; Back to Dashboard
        </Button>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-500/10">
          <h1 className="font-mono text-xs tracking-wider text-amber-400/80 uppercase">
            Flag a Player
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Think you know what someone&apos;s secret side task is?
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                Who do you want to flag?
              </label>
              {targetId && targetName ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5">
                  <span className="text-sm font-medium text-amber-200">
                    {targetName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTargetId("");
                      setSearch("");
                    }}
                    className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="search"
                    placeholder={`Search ${players.length || ""} players by name...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 bg-background/50 border-border/50"
                    autoComplete="off"
                  />
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-border/40 bg-background/30 divide-y divide-border/20">
                    {filteredPlayers.length === 0 ? (
                      <p className="px-3 py-4 text-xs font-mono text-muted-foreground/60 text-center">
                        No players match &ldquo;{search}&rdquo;
                      </p>
                    ) : (
                      filteredPlayers.map((p) => (
                        <button
                          type="button"
                          key={p._id}
                          onClick={() => {
                            setTargetId(p._id);
                            setSearch("");
                          }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-amber-500/10 hover:text-amber-200 transition-colors"
                        >
                          {p.name}
                        </button>
                      ))
                    )}
                  </div>
                  {normalizedSearch && filteredPlayers.length > 0 && (
                    <p className="text-[11px] font-mono text-muted-foreground/50">
                      {filteredPlayers.length} match{filteredPlayers.length !== 1 ? "es" : ""}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                What do you think their side task is?
              </label>
              <Textarea
                placeholder="Describe what you think they've been secretly trying to do..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                rows={4}
                className="bg-background/50 border-border/50 resize-none leading-relaxed"
              />
              <p className="text-xs text-muted-foreground/60 font-mono">
                The AI auditor will compare your guess to their real task and decide instantly.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive font-mono">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={submitting || !targetId || !guess.trim()}
                className="bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                variant="outline"
              >
                {submitting ? (
                  <span className="font-mono text-xs animate-pulse-glow">AUDITOR DECIDING...</span>
                ) : (
                  "Submit Flag"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/play")}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function FlagPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-4 grid-bg">
      <Suspense
        fallback={
          <div className="font-mono text-sm text-muted-foreground animate-pulse-glow">
            LOADING...
          </div>
        }
      >
        <FlagForm />
      </Suspense>
    </main>
  );
}
