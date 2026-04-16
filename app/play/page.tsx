"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

interface PlayerData {
  _id: string;
  name: string;
  role: "player" | "monitor";
  mainTask: string | null;
  mainTaskPendingVerification: boolean;
  completedMainTasks: string[];
  sideTask: string | null;
  sideTaskCompleted: boolean;
  sideTaskPendingVerification: boolean;
  sideTaskFailed: boolean;
  completedSideTasks: string[];
  score: number;
  flagsRemaining: number;
}

interface FlagData {
  _id: string;
  observation: string;
  justification: string | null;
  status: string;
  auditReason: string | null;
  createdAt: string;
  monitorId: { _id: string; name: string } | null;
  targetId: { _id: string; name: string } | null;
}

export default function PlayPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [flagsAgainstMe, setFlagsAgainstMe] = useState<FlagData[]>([]);
  const [flagsByMe, setFlagsByMe] = useState<FlagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingMain, setCompletingMain] = useState(false);
  const [completingSide, setCompletingSide] = useState(false);
  const [mainQr, setMainQr] = useState<string | null>(null);
  const [sideQr, setSideQr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setPlayer(data.player);
      setFlagsAgainstMe(data.flagsAgainstMe);
      setFlagsByMe(data.flagsByMe);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!player?._id) return;
    const baseUrl = `${window.location.origin}/player/${player._id}`;
    const qrOpts = { width: 200, margin: 2, color: { dark: "#ffffff", light: "#00000000" } };

    if (player.mainTaskPendingVerification) {
      QRCode.toDataURL(`${baseUrl}?verify=main`, qrOpts).then(setMainQr).catch(() => {});
    } else {
      setMainQr(null);
    }

    if (player.sideTaskPendingVerification) {
      QRCode.toDataURL(`${baseUrl}?verify=side`, qrOpts).then(setSideQr).catch(() => {});
    } else {
      setSideQr(null);
    }
  }, [player?.mainTaskPendingVerification, player?.sideTaskPendingVerification, player?._id]);

  async function handleComplete(taskType: "main" | "side") {
    const setter = taskType === "main" ? setCompletingMain : setCompletingSide;
    setter(true);
    const res = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType }),
    });
    if (res.ok) await fetchData();
    setter(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center grid-bg">
        <div className="font-mono text-sm text-muted-foreground animate-pulse-glow">
          LOADING DOSSIER...
        </div>
      </main>
    );
  }

  if (!player) return null;

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/player/${player._id}`
      : "";
  const totalCompleted = (player.completedMainTasks?.length ?? 0) + (player.completedSideTasks?.length ?? 0);

  return (
    <main className="flex-1 grid-bg">
      <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-lg tabular-nums text-muted-foreground">
                {player.score}<span className="text-xs ml-1">PTS</span>
              </span>
              {totalCompleted > 0 && (
                <span className="font-mono text-xs text-emerald-400/60">
                  {totalCompleted} task{totalCompleted !== 1 ? "s" : ""} done
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/leaderboard")} className="font-mono text-xs">
              Leaderboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/rules")} className="font-mono text-xs">
              Rules
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} className="font-mono text-xs">
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-muted-foreground">
              Logout
            </Button>
          </div>
        </div>

        {/* Main Task */}
        <TaskSection
          title="Main Task"
          pointValue="+1"
          task={player.mainTask}
          isPending={player.mainTaskPendingVerification}
          isCompleting={completingMain}
          canRequest={!player.mainTaskPendingVerification}
          onRequest={() => handleComplete("main")}
          qrDataUrl={mainQr}
          profileUrl={`${profileUrl}?verify=main`}
        />

        {/* Side Task */}
        <TaskSection
          title="Side Task"
          titleExtra={<span className="text-destructive/60">(Secret)</span>}
          pointValue="+5"
          task={player.sideTask}
          isPending={player.sideTaskPendingVerification}
          isFailed={player.sideTaskFailed}
          isCompleting={completingSide}
          canRequest={!player.sideTaskPendingVerification && !player.sideTaskFailed}
          onRequest={() => handleComplete("side")}
          qrDataUrl={sideQr}
          profileUrl={`${profileUrl}?verify=side`}
        />

        {/* Completed Tasks */}
        {totalCompleted > 0 && (
          <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] overflow-hidden">
            <div className="px-5 py-3 border-b border-emerald-500/10 flex items-center justify-between">
              <h2 className="font-mono text-xs tracking-wider text-emerald-400/80 uppercase">
                Completed Tasks
              </h2>
              <span className="font-mono text-xs text-emerald-400/40">
                {totalCompleted}
              </span>
            </div>
            <div className="divide-y divide-emerald-500/[0.06]">
              {(player.completedMainTasks ?? []).map((task, i) => (
                <div key={`main-${i}`} className="px-5 py-3 flex items-start gap-3">
                  <span className="font-mono text-[10px] text-muted-foreground/30 mt-0.5 shrink-0 border border-border/30 rounded px-1">
                    +1
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{task}</p>
                </div>
              ))}
              {(player.completedSideTasks ?? []).map((task, i) => (
                <div key={`side-${i}`} className="px-5 py-3 flex items-start gap-3">
                  <span className="font-mono text-[10px] text-emerald-400/40 mt-0.5 shrink-0 border border-emerald-500/20 rounded px-1">
                    +5
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{task}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Flag Others */}
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-500/10 flex items-center justify-between">
            <h2 className="font-mono text-xs tracking-wider text-amber-400/80 uppercase">
              Flag Others
            </h2>
            <span className="font-mono text-xs text-amber-400/60">
              {player.flagsRemaining} FLAGS REMAINING
            </span>
          </div>
          <div className="px-5 py-4">
            {player.flagsRemaining > 0 ? (
              <Button
                onClick={() => router.push("/flag")}
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                Flag Suspicious Behavior
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground font-mono">
                All flags deployed
              </p>
            )}
          </div>
        </section>

        {/* Flags I've Filed */}
        {flagsByMe.length > 0 && (
          <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/30">
              <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                Filed Reports
              </h2>
            </div>
            <div className="divide-y divide-border/30">
              {flagsByMe.map((flag) => (
                <div key={flag._id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {flag.targetId?.name ?? "Unknown"}
                    </span>
                    <FlagStatusBadge status={flag.status} />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {flag.observation}
                  </p>
                  {flag.justification && (
                    <p className="text-sm text-muted-foreground/70 border-l-2 border-border/40 pl-3">
                      <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">Their response: </span>
                      {flag.justification}
                    </p>
                  )}
                  {flag.auditReason && (
                    <p className="text-sm italic text-muted-foreground/80 border-l-2 border-muted-foreground/20 pl-3">
                      {flag.auditReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Flags Against Me */}
        {flagsAgainstMe.length > 0 && (
          <section className="rounded-xl border border-destructive/20 bg-destructive/[0.03] overflow-hidden">
            <div className="px-5 py-3 border-b border-destructive/10">
              <h2 className="font-mono text-xs tracking-wider text-destructive/70 uppercase">
                Flags Against You
              </h2>
            </div>
            <div className="divide-y divide-destructive/10">
              {flagsAgainstMe.map((flag) => (
                <div key={flag._id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Flagged by {flag.monitorId?.name ?? "Unknown"}
                    </span>
                    <FlagStatusBadge status={flag.status} />
                  </div>
                  <p className="text-sm leading-relaxed">{flag.observation}</p>
                  {flag.status === "pending_justification" && (
                    <Button
                      size="sm"
                      onClick={() => router.push(`/respond/${flag._id}`)}
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                      variant="outline"
                    >
                      Submit Defense
                    </Button>
                  )}
                  {flag.auditReason && (
                    <p className="text-sm italic text-muted-foreground/80 border-l-2 border-muted-foreground/20 pl-3">
                      {flag.auditReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function TaskSection({
  title,
  titleExtra,
  pointValue,
  task,
  isPending,
  isFailed,
  isCompleting,
  canRequest,
  onRequest,
  qrDataUrl,
  profileUrl,
}: {
  title: string;
  titleExtra?: React.ReactNode;
  pointValue: string;
  task: string | null;
  isPending: boolean;
  isFailed?: boolean;
  isCompleting: boolean;
  canRequest: boolean;
  onRequest: () => void;
  qrDataUrl: string | null;
  profileUrl: string;
}) {
  return (
    <section className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
        <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {title} {titleExtra}
          <span className="ml-2 text-emerald-400/50">({pointValue})</span>
        </h2>
        {isPending && (
          <span className="font-mono text-xs text-amber-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-glow" />
            AWAITING VERIFICATION
          </span>
        )}
        {isFailed && (
          <span className="font-mono text-xs text-destructive flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            CAUGHT
          </span>
        )}
      </div>
      <div className="px-5 py-4 space-y-4">
        <p className="text-[15px] leading-relaxed">{task}</p>
        {canRequest && !isPending && (
          <Button
            onClick={onRequest}
            disabled={isCompleting}
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            {isCompleting ? (
              <span className="font-mono text-xs">SUBMITTING...</span>
            ) : (
              "Request Verification"
            )}
          </Button>
        )}
        {isPending && (
          <div className="rounded-lg bg-amber-500/[0.04] border border-amber-500/15 p-4 space-y-4">
            <p className="text-sm text-amber-400/80">
              Show this QR code to another player to verify your task.
            </p>
            {qrDataUrl && (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="Verification QR code" className="w-48 h-48" />
              </div>
            )}
            <p className="text-xs text-muted-foreground font-mono break-all text-center">
              {profileUrl}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function FlagStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending_justification":
      return (
        <span className="font-mono text-xs text-amber-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-glow" />
          AWAITING RESPONSE
        </span>
      );
    case "pending_audit":
      return (
        <span className="font-mono text-xs text-blue-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-glow" />
          UNDER REVIEW
        </span>
      );
    case "cleared":
      return (
        <span className="font-mono text-xs text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          CLEARED
        </span>
      );
    case "caught":
      return (
        <span className="font-mono text-xs text-destructive flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
          CAUGHT
        </span>
      );
    default:
      return <span className="font-mono text-xs text-muted-foreground">{status}</span>;
  }
}
