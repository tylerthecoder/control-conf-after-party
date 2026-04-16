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
  const [observation, setObservation] = useState("");
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
        body: JSON.stringify({ targetId, observation }),
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
            File a Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Document suspicious behavior for AI auditor review
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                Subject
              </label>
              <Select value={targetId} onValueChange={(v) => setTargetId(v ?? "")}>
                <SelectTrigger className="h-11 bg-background/50 border-border/50">
                  <SelectValue placeholder="Select a player..." />
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
                Observation
              </label>
              <Textarea
                placeholder="Describe the suspicious behavior you witnessed..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={4}
                className="bg-background/50 border-border/50 resize-none leading-relaxed"
              />
              <p className="text-xs text-muted-foreground/60 font-mono">
                Be specific. The AI auditor will evaluate your claim.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive font-mono">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={submitting || !targetId || !observation.trim()}
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
