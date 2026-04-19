"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

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
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Player not found.</p>
      </main>
    );
  }

  if (loggedIn === false) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
          <div className="space-y-3 border border-border bg-card p-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/70">
              Verification request
            </p>
            <p className="text-[15px] text-muted-foreground">
              <span className="font-medium text-foreground">{player.name}</span>{" "}
              needs someone to verify their task. Join the party first to
              confirm it.
            </p>
            <div className="pt-2">
              <Button onClick={() => router.push("/")}>Join the party</Button>
            </div>
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

  const preferredType =
    verifyHint === "main" ? "main" : verifyHint === "side" ? "side" : null;

  const verifyBlocks: {
    type: "main" | "side";
    task: string;
    points: string;
    label: string;
  }[] = [];
  if (showMainVerify)
    verifyBlocks.push({
      type: "main",
      task: player.mainTask!,
      points: "+1",
      label: "Main task",
    });
  if (showSideVerify)
    verifyBlocks.push({
      type: "side",
      task: player.sideTask!,
      points: "+5",
      label: "Side task",
    });
  if (preferredType) {
    verifyBlocks.sort((a, b) =>
      a.type === preferredType ? -1 : b.type === preferredType ? 1 : 0
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        {/* Header */}
        <header className="space-y-1 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Verifying
          </p>
          <h1 className="font-serif text-3xl tracking-tight text-foreground">
            {player.name}
          </h1>
        </header>

        {/* Verification blocks */}
        {verifyBlocks.map((block) => (
          <section
            key={block.type}
            className="space-y-4 border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/70">
                {block.label} verification
              </p>
              <span className="font-mono text-[13px] tabular-nums text-success">
                {block.points}
              </span>
            </div>
            <p className="text-[14.5px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                {player.name}
              </span>{" "}
              claims to have completed this task. Did you witness it?
            </p>
            <div className="border-l-2 border-border bg-paper-soft px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Their task
              </p>
              <p className="mt-1 font-serif text-[17px] leading-snug text-foreground">
                {block.task}
              </p>
            </div>
            {verifyError && verifying === null && (
              <p className="text-sm text-destructive">{verifyError}</p>
            )}
            <Button
              onClick={() => handleVerify(block.type)}
              disabled={verifying !== null}
              className="w-full"
            >
              {verifying === block.type
                ? "Verifying…"
                : "I confirm they did this"}
            </Button>
          </section>
        ))}

        {verified === "main" && (
          <VerifiedBanner name={player.name} points={1} />
        )}
        {verified === "side" && (
          <VerifiedBanner name={player.name} points={5} />
        )}

        {isSelf && hasSomethingPending && (
          <section className="space-y-2 border border-border bg-card p-5 text-center">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Awaiting verification
            </span>
            <p className="text-sm text-muted-foreground">
              Someone else needs to scan this page to verify your task.
            </p>
          </section>
        )}

        {!hasSomethingPending && !verified && (
          <section className="border border-border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">
              {player.name} doesn&apos;t have a task pending verification right
              now.
            </p>
          </section>
        )}

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/play")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}

function VerifiedBanner({ name, points }: { name: string; points: number }) {
  return (
    <section className="space-y-2 border-l-2 border-success bg-success/5 px-5 py-4 text-center">
      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Verified
      </span>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{name}</span>&apos;s task
        has been confirmed. They earned{" "}
        <span className="font-medium text-success">+{points}</span> point
        {points !== 1 ? "s" : ""}.
      </p>
    </section>
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
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <PlayerContent id={id} />
    </Suspense>
  );
}
