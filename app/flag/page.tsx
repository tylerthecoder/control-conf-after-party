"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Player {
  _id: string;
  name: string;
  role: string;
}

function FlagForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledTarget = searchParams.get("target");

  const [players, setPlayers] = useState<Player[]>([]);
  const [targetId, setTargetId] = useState(prefilledTarget || "");
  const [guess, setGuess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => {});
  }, []);

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

      router.push("/play");
    } catch {
      setError("Failed to submit flag");
    } finally {
      setSubmitting(false);
    }
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
              <Select value={targetId} onValueChange={(v) => setTargetId(v ?? "")}>
                <SelectTrigger className="h-11 bg-background/50 border-border/50">
                  <SelectValue placeholder="Select a player...">
                    {players.find((p) => p._id === targetId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                They can admit you caught them, or deny it and let the AI auditor decide.
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
                  <span className="font-mono text-xs">SUBMITTING...</span>
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
