"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

interface PlayerInfo {
  _id: string;
  name: string;
  mainTask: string | null;
  mainTaskPendingVerification: boolean;
  sideTask: string | null;
  sideTaskPendingVerification: boolean;
  sideTaskCompleted: boolean;
}

function PlayerContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyHint = searchParams.get("verify");

  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [me, setMe] = useState<{ _id?: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verified, setVerified] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/players/${id}`).then((r) => r.json()),
      fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([playerData, meData]) => {
        setPlayer(playerData);
        if (meData?.player) {
          setMe(meData.player);
          setLoggedIn(true);
        } else {
          setMe(null);
          setLoggedIn(false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleVerify(taskType: "main" | "side") {
    setVerifying(taskType);
    setVerifyError("");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: id, taskType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Something went wrong");
      } else {
        setVerified(taskType);
      }
    } catch {
      setVerifyError("Failed to verify");
    } finally {
      setVerifying(null);
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

  if (loggedIn === false) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 grid-bg">
        <div className="w-full max-w-sm space-y-5 animate-fade-in-up">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-glow" />
              <h2 className="font-mono text-xs tracking-wider text-amber-400/80 uppercase">
                Verification Request
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{player.name}</span>{" "}
              needs someone to verify their task. Join the party first to confirm it.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
              variant="outline"
            >
              Join the Party
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const isSelf = me?._id === player._id;
  const hasPendingMain = player.mainTaskPendingVerification;
  const hasPendingSide = player.sideTaskPendingVerification;
  const hasSomethingPending = hasPendingMain || hasPendingSide;

  const showMainVerify = hasPendingMain && !isSelf && verified !== "main";
  const showSideVerify = hasPendingSide && !isSelf && verified !== "side";

  const preferredType = verifyHint === "main" ? "main" : verifyHint === "side" ? "side" : null;

  const verifyBlocks: { type: "main" | "side"; task: string; points: string; label: string }[] = [];
  if (showMainVerify) verifyBlocks.push({ type: "main", task: player.mainTask!, points: "+1", label: "Main Task" });
  if (showSideVerify) verifyBlocks.push({ type: "side", task: player.sideTask!, points: "+5", label: "Side Task" });
  if (preferredType) {
    verifyBlocks.sort((a, b) => (a.type === preferredType ? -1 : b.type === preferredType ? 1 : 0));
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4 grid-bg">
      <div className="w-full max-w-sm space-y-5 animate-fade-in-up">
        {/* Verification blocks */}
        {verifyBlocks.map((block) => (
          <div key={block.type} className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-glow" />
                <h2 className="font-mono text-xs tracking-wider text-amber-400/80 uppercase">
                  {block.label} Verification
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{player.name}</span>{" "}
                claims to have completed this task. Did you witness it?
              </p>
              <div className="rounded-lg bg-background/50 border border-border/30 p-3">
                <p className="font-mono text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
                  Their task was <span className="text-emerald-400/50">({block.points})</span>
                </p>
                <p className="text-sm leading-relaxed">{block.task}</p>
              </div>
            </div>
            {verifyError && verifying === null && (
              <p className="text-sm text-destructive font-mono">{verifyError}</p>
            )}
            <Button
              onClick={() => handleVerify(block.type)}
              disabled={verifying !== null}
              className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              variant="outline"
            >
              {verifying === block.type ? (
                <span className="font-mono text-xs">VERIFYING...</span>
              ) : (
                "I confirm they did this"
              )}
            </Button>
          </div>
        ))}

        {/* Verified confirmations */}
        {verified === "main" && (
          <VerifiedBanner name={player.name} points={1} />
        )}
        {verified === "side" && (
          <VerifiedBanner name={player.name} points={5} />
        )}

        {/* Self-viewing */}
        {isSelf && hasSomethingPending && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5 text-center space-y-2">
            <span className="font-mono text-xs text-amber-400 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-glow" />
              AWAITING VERIFICATION
            </span>
            <p className="text-sm text-muted-foreground">
              Someone else needs to scan this page to verify your task.
            </p>
          </div>
        )}

        {/* No pending verification */}
        {!hasSomethingPending && !verified && (
          <div className="rounded-xl border border-border/30 bg-card/30 p-5 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {player.name} doesn&apos;t have a task pending verification right now.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="text-center">
          <Button variant="outline" onClick={() => router.push("/play")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}

function VerifiedBanner({ name, points }: { name: string; points: number }) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5 text-center space-y-2">
      <span className="font-mono text-xs text-emerald-400 flex items-center justify-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        VERIFIED
      </span>
      <p className="text-sm text-muted-foreground">
        {name}&apos;s task has been confirmed. They earned +{points} point{points !== 1 ? "s" : ""}.
      </p>
    </div>
  );
}

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center grid-bg">
          <div className="font-mono text-sm text-muted-foreground animate-pulse-glow">
            LOADING...
          </div>
        </main>
      }
    >
      <PlayerContent id={id} />
    </Suspense>
  );
}
