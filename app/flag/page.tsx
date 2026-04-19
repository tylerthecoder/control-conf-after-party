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
    ? players.filter((p) =>
        p.name.toLowerCase().includes(normalizedSearch)
      )
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
      <div className="w-full max-w-xl animate-fade-in-up">
        <header className="space-y-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Auditor verdict
          </p>
          <h1
            className={`font-serif text-4xl tracking-tight ${
              isCaught ? "text-success" : "text-destructive"
            }`}
          >
            {isCaught ? "Caught." : "Cleared."}
          </h1>
          <p className="text-[15px] text-muted-foreground">
            {isCaught ? (
              <>
                You correctly identified{" "}
                <span className="font-medium text-foreground">
                  {targetName ?? "their"}
                </span>
                &apos;s side task.{" "}
                <span className="font-mono tabular-nums text-success">+3</span>{" "}
                points.
              </>
            ) : (
              <>
                Your guess about{" "}
                <span className="font-medium text-foreground">
                  {targetName ?? "them"}
                </span>{" "}
                was wrong.{" "}
                <span className="font-mono tabular-nums text-destructive">
                  −2
                </span>{" "}
                points.
              </>
            )}
          </p>
        </header>

        <div className="hr-rule my-8" />

        <div className="space-y-4">
          <div
            className={`border-l-2 px-4 py-3 ${
              isCaught
                ? "border-success bg-success/5"
                : "border-destructive bg-destructive/5"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              AI auditor&apos;s ruling
            </p>
            <p className="mt-1 font-serif text-[17px] leading-snug text-foreground">
              {result.reason}
            </p>
          </div>
          <Button onClick={() => router.push("/play")} className="w-full">
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl animate-fade-in-up">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          File a flag
        </p>
        <h1 className="font-serif text-4xl tracking-tight text-foreground">
          Flag a player.
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Think you know what someone&apos;s secret side task is? Pick them and
          describe what you think they&apos;ve been doing. The AI auditor
          decides instantly.
        </p>
      </header>

      <div className="hr-rule my-8" />

      <form onSubmit={handleSubmit} className="space-y-7">
        <div className="space-y-3">
          <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Who do you want to flag?
          </label>
          {targetId && targetName ? (
            <div className="flex items-center justify-between gap-3 border border-foreground/30 bg-paper-soft px-4 py-3">
              <span className="text-[15px] font-medium text-foreground">
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
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                type="search"
                placeholder={`Search ${players.length || ""} players by name…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              <div className="max-h-64 divide-y divide-border/70 overflow-y-auto border border-border bg-card">
                {filteredPlayers.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
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
                      className="block w-full px-4 py-2.5 text-left text-[15px] text-foreground transition-colors hover:bg-paper-soft hover:text-brand"
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
              {normalizedSearch && filteredPlayers.length > 0 && (
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {filteredPlayers.length} match
                  {filteredPlayers.length !== 1 ? "es" : ""}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            What do you think their side task is?
          </label>
          <Textarea
            placeholder="Describe what you think they've been secretly trying to do…"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-[12px] text-muted-foreground">
            The AI auditor will compare your guess to their real task and
            decide instantly.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="submit"
            disabled={submitting || !targetId || !guess.trim()}
          >
            {submitting ? "Auditor deciding…" : "Submit flag"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/play")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function FlagPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-14 sm:py-20">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading…</p>
        }
      >
        <FlagForm />
      </Suspense>
    </main>
  );
}
