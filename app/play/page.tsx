"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCode from "qrcode";

interface PlayerData {
  _id: string;
  name: string;
  role: "player" | "monitor";
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
  guess: string;
  selfReport?: boolean;
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
  const [completingSide, setCompletingSide] = useState(false);
  const [cancelingSide, setCancelingSide] = useState(false);
  const [selfReporting, setSelfReporting] = useState(false);
  const [showSelfReportPicker, setShowSelfReportPicker] = useState(false);
  const [allPlayers, setAllPlayers] = useState<{ _id: string; name: string }[]>([]);
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

    if (player.sideTaskPendingVerification) {
      QRCode.toDataURL(`${baseUrl}?verify=side`, qrOpts).then(setSideQr).catch(() => {});
    } else {
      setSideQr(null);
    }
  }, [player?.sideTaskPendingVerification, player?._id]);

  async function handleCompleteSide() {
    setCompletingSide(true);
    const res = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType: "side" }),
    });
    if (res.ok) await fetchData();
    setCompletingSide(false);
  }

  async function handleCancelSideVerification() {
    setCancelingSide(true);
    const res = await fetch("/api/cancel-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskType: "side" }),
    });
    if (res.ok) await fetchData();
    setCancelingSide(false);
  }

  async function openSelfReportPicker() {
    setShowSelfReportPicker(true);
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      setAllPlayers(data.filter((p: { _id: string }) => p._id !== player?._id));
    } catch { /* ignore */ }
  }

  async function handleSelfReport(catcherId: string) {
    setSelfReporting(true);
    const res = await fetch("/api/self-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catcherId }),
    });
    if (res.ok) {
      setShowSelfReportPicker(false);
      await fetchData();
    }
    setSelfReporting(false);
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
  const totalCompleted = player.completedSideTasks?.length ?? 0;

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
          onRequest={handleCompleteSide}
          onCancel={handleCancelSideVerification}
          canceling={cancelingSide}
          qrDataUrl={sideQr}
          profileUrl={`${profileUrl}?verify=side`}
          onSelfReport={openSelfReportPicker}
          selfReporting={selfReporting}
          showSelfReportPicker={showSelfReportPicker}
          selfReportPlayers={allPlayers}
          onSelfReportSelect={handleSelfReport}
          onSelfReportCancel={() => setShowSelfReportPicker(false)}
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
          <div className="px-5 py-3 border-b border-amber-500/10">
            <h2 className="font-mono text-xs tracking-wider text-amber-400/80 uppercase">
              Flag Others
            </h2>
          </div>
          <div className="px-5 py-4">
            <Button
              onClick={() => router.push("/flag")}
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              Flag Suspicious Behavior
            </Button>
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
                      {flag.selfReport && (
                        <span className="ml-2 font-mono text-[10px] text-muted-foreground/40">(they self-reported)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {flag.status === "caught" && (
                        <span className="font-mono text-xs font-bold text-emerald-400">+3</span>
                      )}
                      {flag.status === "cleared" && (
                        <span className="font-mono text-xs font-bold text-destructive">-2</span>
                      )}
                      <FlagStatusBadge status={flag.status} />
                    </div>
                  </div>
                  {!flag.selfReport && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">Your guess: </span>
                      {flag.guess}
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
                      {flag.selfReport
                        ? <>Self-reported — caught by {flag.monitorId?.name ?? "Unknown"}</>
                        : <>Flagged by {flag.monitorId?.name ?? "Unknown"}</>}
                    </span>
                    <div className="flex items-center gap-2">
                      {flag.status === "caught" && (
                        <span className="font-mono text-xs font-bold text-destructive">-1</span>
                      )}
                      <FlagStatusBadge status={flag.status} />
                    </div>
                  </div>
                  {!flag.selfReport && (
                    <p className="text-sm leading-relaxed">
                      <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">Their guess: </span>
                      {flag.guess}
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
  onCancel,
  canceling,
  qrDataUrl,
  profileUrl,
  onSelfReport,
  selfReporting,
  showSelfReportPicker,
  selfReportPlayers,
  onSelfReportSelect,
  onSelfReportCancel,
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
  onCancel: () => void;
  canceling: boolean;
  qrDataUrl: string | null;
  profileUrl: string;
  onSelfReport?: () => void;
  selfReporting?: boolean;
  showSelfReportPicker?: boolean;
  selfReportPlayers?: { _id: string; name: string }[];
  onSelfReportSelect?: (catcherId: string) => void;
  onSelfReportCancel?: () => void;
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
          <div className="flex items-center gap-3">
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
            {onSelfReport && !showSelfReportPicker && (
              <Button
                onClick={onSelfReport}
                disabled={selfReporting}
                variant="ghost"
                size="sm"
                className="text-xs text-destructive/60 hover:text-destructive hover:bg-destructive/10"
              >
                Somebody caught me
              </Button>
            )}
          </div>
        )}
        {showSelfReportPicker && (
          <SelfReportPicker
            players={selfReportPlayers ?? []}
            selfReporting={!!selfReporting}
            onSelect={(id) => onSelfReportSelect?.(id)}
            onCancel={() => onSelfReportCancel?.()}
          />
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
            <div className="flex justify-center pt-1">
              <Button
                onClick={onCancel}
                disabled={canceling}
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
              >
                {canceling ? "Canceling..." : "Cancel Request"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SelfReportPicker({
  players,
  selfReporting,
  onSelect,
  onCancel,
}: {
  players: { _id: string; name: string }[];
  selfReporting: boolean;
  onSelect: (id: string) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const normalized = search.trim().toLowerCase();
  const filtered = normalized
    ? players.filter((p) => p.name.toLowerCase().includes(normalized))
    : players;

  return (
    <div className="rounded-lg bg-destructive/[0.04] border border-destructive/15 p-4 space-y-3">
      <p className="text-sm text-destructive/80 font-medium">
        Who caught you? <span className="text-muted-foreground/60 font-normal">(they&apos;ll get +3 pts, you&apos;ll get -1)</span>
      </p>
      <Input
        type="search"
        placeholder={`Search ${players.length || ""} players by name...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={selfReporting}
        autoComplete="off"
        className="h-10 bg-background/50 border-destructive/20"
      />
      <div className="max-h-56 overflow-y-auto -mx-1 px-1">
        {filtered.length === 0 ? (
          <p className="px-1 py-3 text-xs font-mono text-muted-foreground/60 text-center">
            No players match &ldquo;{search}&rdquo;
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((p) => (
              <Button
                key={p._id}
                onClick={() => onSelect(p._id)}
                disabled={selfReporting}
                variant="outline"
                size="sm"
                className="text-xs border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
              >
                {p.name}
              </Button>
            ))}
          </div>
        )}
      </div>
      {selfReporting && (
        <p className="font-mono text-xs text-muted-foreground animate-pulse-glow">REPORTING...</p>
      )}
      <Button
        onClick={onCancel}
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
      >
        Cancel
      </Button>
    </div>
  );
}

function FlagStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="font-mono text-xs text-amber-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-glow" />
          PENDING
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
