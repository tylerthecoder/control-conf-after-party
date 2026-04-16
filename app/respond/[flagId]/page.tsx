"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FlagDetail {
  _id: string;
  observation: string;
  status: string;
  auditReason: string | null;
  monitorId: { name: string } | null;
}

export default function RespondPage({
  params,
}: {
  params: Promise<{ flagId: string }>;
}) {
  const { flagId } = use(params);
  const router = useRouter();
  const [flag, setFlag] = useState<FlagDetail | null>(null);
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState<{
    verdict: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/flags/${flagId}`)
      .then((r) => r.json())
      .then(setFlag)
      .catch(() => {});
  }, [flagId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/flags/${flagId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justification }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setVerdict({ verdict: data.verdict, reason: data.reason });
    } catch {
      setError("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  }

  if (!flag) {
    return (
      <main className="flex-1 flex items-center justify-center grid-bg">
        <div className="font-mono text-sm text-muted-foreground animate-pulse-glow">
          LOADING CASE FILE...
        </div>
      </main>
    );
  }

  if (verdict) {
    const isCaught = verdict.verdict === "caught";

    return (
      <main className="flex-1 flex items-center justify-center p-4 grid-bg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] ${
              isCaught ? "bg-red-500/[0.06]" : "bg-emerald-500/[0.06]"
            }`}
          />
        </div>

        <div className="relative w-full max-w-lg text-center space-y-6 animate-fade-in-up">
          <div className="space-y-3">
            <div
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border font-mono text-sm tracking-wider ${
                isCaught
                  ? "border-red-500/40 text-red-400 bg-red-500/10"
                  : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCaught ? "bg-red-400" : "bg-emerald-400"
                }`}
              />
              {isCaught ? "CAUGHT" : "CLEARED"}
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              {isCaught ? "Busted." : "You're in the clear."}
            </h1>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <p className="text-sm font-mono text-muted-foreground/60 uppercase tracking-wider mb-2">
              Auditor&apos;s Ruling
            </p>
            <p className="text-lg italic leading-relaxed">
              &ldquo;{verdict.reason}&rdquo;
            </p>
          </div>

          <Button
            onClick={() => router.push("/play")}
            variant="outline"
            className="mt-2"
          >
            Return to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  if (flag.status !== "pending_justification") {
    return (
      <main className="flex-1 flex items-center justify-center p-4 grid-bg">
        <div className="w-full max-w-lg space-y-4 text-center animate-fade-in-up">
          <h1 className="text-2xl font-bold">Case Resolved</h1>
          <p className="text-muted-foreground">
            This flag has already been adjudicated.
          </p>
          {flag.auditReason && (
            <div className="rounded-xl border border-border/50 bg-card/50 p-6">
              <p className="text-sm font-mono text-muted-foreground/60 uppercase tracking-wider mb-2">
                Ruling
              </p>
              <p className="italic">&ldquo;{flag.auditReason}&rdquo;</p>
            </div>
          )}
          <Button
            onClick={() => router.push("/play")}
            variant="outline"
          >
            Return to Dashboard
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4 grid-bg">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="rounded-xl border border-destructive/20 bg-destructive/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-destructive/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-glow" />
              <h1 className="font-mono text-xs tracking-wider text-destructive/80 uppercase">
                You&apos;ve Been Flagged
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              A monitor has reported suspicious behavior. Defend yourself.
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="rounded-lg bg-background/50 border border-border/30 p-4">
              <p className="font-mono text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
                Monitor&apos;s Observation
              </p>
              <p className="text-[15px] leading-relaxed">{flag.observation}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  Your Defense
                </label>
                <Textarea
                  placeholder="Explain what you were actually doing..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  className="bg-background/50 border-border/50 resize-none leading-relaxed"
                />
                <p className="text-xs text-muted-foreground/60 font-mono">
                  An AI auditor will evaluate your response. Be convincing.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive font-mono">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting || !justification.trim()}
                className="w-full h-11"
              >
                {submitting ? (
                  <span className="font-mono text-xs animate-pulse-glow">
                    THE AUDITOR IS DELIBERATING...
                  </span>
                ) : (
                  "Submit Defense"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
