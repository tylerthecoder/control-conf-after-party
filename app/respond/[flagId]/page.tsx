"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface FlagDetail {
  _id: string;
  guess: string;
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

  async function handleRespond(action: "admit" | "deny") {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/flags/${flagId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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
              {isCaught && verdict.reason === "Target admitted the monitor was right."
                ? "Self-Report"
                : "Auditor's Ruling"}
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

  if (flag.status !== "pending") {
    return (
      <main className="flex-1 flex items-center justify-center p-4 grid-bg">
        <div className="w-full max-w-lg space-y-4 text-center animate-fade-in-up">
          <h1 className="text-2xl font-bold">Case Resolved</h1>
          <p className="text-muted-foreground">
            This flag has already been resolved.
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
              {flag.monitorId?.name ?? "Someone"} thinks they know your side task.
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="rounded-lg bg-background/50 border border-border/30 p-4">
              <p className="font-mono text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
                Their Guess
              </p>
              <p className="text-[15px] leading-relaxed">{flag.guess}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Did they get it right?
              </p>

              {error && (
                <p className="text-sm text-destructive font-mono">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => handleRespond("admit")}
                  disabled={submitting}
                  className="flex-1 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                  variant="outline"
                >
                  {submitting ? (
                    <span className="font-mono text-xs animate-pulse-glow">PROCESSING...</span>
                  ) : (
                    "They caught me"
                  )}
                </Button>
                <Button
                  onClick={() => handleRespond("deny")}
                  disabled={submitting}
                  className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                  variant="outline"
                >
                  {submitting ? (
                    <span className="font-mono text-xs animate-pulse-glow">AUDITOR DECIDING...</span>
                  ) : (
                    "No they didn't"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60 font-mono text-center">
                Denying sends it to the AI auditor for a ruling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
