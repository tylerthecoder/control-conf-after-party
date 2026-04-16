"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PlayerInfo {
  _id: string;
  name: string;
  role: "player" | "monitor";
  sideTask: string | null;
  sideTaskPendingVerification: boolean;
  sideTaskCompleted: boolean;
}

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [me, setMe] = useState<{ _id?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/players/${id}`).then((r) => r.json()),
      fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([playerData, meData]) => {
        setPlayer(playerData);
        setMe(meData?.player ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);


  async function handleVerify() {
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Something went wrong");
      } else {
        setVerified(true);
      }
    } catch {
      setVerifyError("Failed to verify");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center grid-bg">
        <div className="font-mono text-sm text-muted-foreground animate-pulse-glow">
          LOADING...
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="flex-1 flex items-center justify-center grid-bg">
        <p className="text-muted-foreground">Player not found</p>
      </main>
    );
  }

  const isSelf = me?._id === player._id;
  const canVerify =
    player.sideTaskPendingVerification && !isSelf && me != null && !verified;

  return (
    <main className="flex-1 flex items-center justify-center p-4 grid-bg">
      <div className="w-full max-w-sm space-y-5 animate-fade-in-up">
        {/* Player card */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
        </div>

        {/* Verification request */}
        {canVerify && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-glow" />
                <h2 className="font-mono text-xs tracking-wider text-amber-400/80 uppercase">
                  Verification Requested
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{player.name}</span>{" "}
                claims to have completed their side task. Did you witness it?
              </p>
              <div className="rounded-lg bg-background/50 border border-border/30 p-3">
                <p className="font-mono text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
                  Their task was
                </p>
                <p className="text-sm leading-relaxed">{player.sideTask}</p>
              </div>
            </div>
            {verifyError && (
              <p className="text-sm text-destructive font-mono">{verifyError}</p>
            )}
            <Button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              variant="outline"
            >
              {verifying ? (
                <span className="font-mono text-xs">VERIFYING...</span>
              ) : (
                "I confirm they did this"
              )}
            </Button>
          </div>
        )}

        {/* Verification confirmed */}
        {verified && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5 text-center space-y-2">
            <span className="font-mono text-xs text-emerald-400 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              VERIFIED
            </span>
            <p className="text-sm text-muted-foreground">
              {player.name}&apos;s task has been confirmed. They earned +1 point.
            </p>
          </div>
        )}

        {/* Already completed */}
        {player.sideTaskCompleted && !verified && (
          <div className="rounded-xl border border-border/30 bg-card/30 p-4 text-center">
            <span className="font-mono text-xs text-emerald-400/60">
              Task already verified
            </span>
          </div>
        )}

        {/* Navigation */}
        <div className="text-center">
          {me ? (
            <Button
              variant="outline"
              onClick={() => router.push("/play")}
            >
              Back to Dashboard
            </Button>
          ) : (
            <Button onClick={() => router.push("/")}>
              Enter the Eval
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
