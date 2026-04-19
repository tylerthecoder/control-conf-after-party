"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCode from "qrcode";

const POLL_INTERVAL_MS = 30_000;

interface PlayerData {
  _id: string;
  name: string;
  role: "player" | "monitor";
  sideTask: string | null;
  sideTaskCompleted: boolean;
  sideTaskPendingVerification: boolean;
  sideTaskFailed: boolean;
  completedSideTasks: string[];
  sideTaskRerollsRemaining: number;
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
  const [rerolling, setRerolling] = useState(false);
  const [showRerollConfirm, setShowRerollConfirm] = useState(false);
  const [selfReporting, setSelfReporting] = useState(false);
  const [showSelfReportPicker, setShowSelfReportPicker] = useState(false);
  const [allPlayers, setAllPlayers] = useState<
    { _id: string; name: string }[]
  >([]);
  const [sideQr, setSideQr] = useState<string | null>(null);
  const seenCaughtFlagIdsRef = useRef<Set<string> | null>(null);

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

      const caughtFlags: FlagData[] = (data.flagsAgainstMe ?? []).filter(
        (f: FlagData) => f.status === "caught"
      );

      if (seenCaughtFlagIdsRef.current === null) {
        seenCaughtFlagIdsRef.current = new Set(caughtFlags.map((f) => f._id));
      } else {
        const seen = seenCaughtFlagIdsRef.current;
        for (const flag of caughtFlags) {
          if (seen.has(flag._id)) continue;
          seen.add(flag._id);
          const catcher = flag.monitorId?.name ?? "Someone";
          const description = flag.selfReport
            ? "You confirmed it yourself."
            : flag.guess
              ? `Their guess: ${flag.guess}`
              : undefined;
          toast.error(`${catcher} caught you!`, {
            description,
            duration: 10_000,
          });
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    if (!player?._id) return;
    const baseUrl = `${window.location.origin}/player/${player._id}`;
    const qrOpts = {
      width: 220,
      margin: 2,
      color: { dark: "#1f1d18", light: "#00000000" },
    };

    if (player.sideTaskPendingVerification) {
      QRCode.toDataURL(`${baseUrl}?verify=side`, qrOpts)
        .then(setSideQr)
        .catch(() => {});
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

  function handleReroll() {
    if (rerolling) return;
    setShowRerollConfirm(true);
  }

  async function confirmReroll() {
    if (rerolling) return;
    setRerolling(true);
    const res = await fetch("/api/reroll", { method: "POST" });
    if (res.ok) await fetchData();
    setRerolling(false);
    setShowRerollConfirm(false);
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
      setAllPlayers(
        data.filter((p: { _id: string }) => p._id !== player?._id)
      );
    } catch {
      /* ignore */
    }
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
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading dossier…</p>
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
    <main className="flex-1">
      <div className="mx-auto w-full max-w-3xl space-y-10 px-5 py-10 sm:px-8 sm:py-14">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Your dossier
            </p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight text-foreground">
              {player.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-serif text-2xl tabular-nums text-foreground">
                {player.score}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Points
              </span>
              {totalCompleted > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-[13px] text-success">
                    {totalCompleted} task{totalCompleted !== 1 ? "s" : ""} done
                  </span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs"
          >
            Sign out
          </Button>
        </header>

        <div className="hr-rule" />

        {/* Side Task */}
        <TaskSection
          title="Side task"
          subtitle="Secret · +5 when verified"
          task={player.sideTask}
          isPending={player.sideTaskPendingVerification}
          isFailed={player.sideTaskFailed}
          isCompleting={completingSide}
          canRequest={
            !player.sideTaskPendingVerification && !player.sideTaskFailed
          }
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
          onReroll={handleReroll}
          rerolling={rerolling}
          rerollsRemaining={player.sideTaskRerollsRemaining ?? 3}
        />

        {/* Flag Others */}
        <Section title="Flag another player" subtitle="Catch a side task">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Suspect what someone else&apos;s secret task is? File a flag — the
            AI auditor decides instantly. Correct: <span className="text-success">+7</span>.
            Wrong: <span className="text-destructive">−2</span>.
          </p>
          <div className="pt-1">
            <Button onClick={() => router.push("/flag")} variant="outline">
              Flag suspicious behavior →
            </Button>
          </div>
        </Section>

        {/* Completed */}
        {totalCompleted > 0 && (
          <Section title="Verified tasks" count={totalCompleted}>
            <ul className="-mt-1 divide-y divide-border/70 border-t border-b border-border/70">
              {(player.completedSideTasks ?? []).map((task, i) => (
                <li
                  key={`side-${i}`}
                  className="flex items-start gap-4 py-3"
                >
                  <span className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-success">
                    +5
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-foreground/85">
                    {task}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Flags I've filed */}
        {flagsByMe.length > 0 && (
          <Section title="Flags you've filed" count={flagsByMe.length}>
            <ul className="divide-y divide-border/70 border-t border-b border-border/70">
              {flagsByMe.map((flag) => (
                <li key={flag._id} className="space-y-2 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-medium text-foreground">
                      {flag.targetId?.name ?? "Unknown"}
                      {flag.selfReport && (
                        <span className="ml-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          (they self-reported)
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      {flag.status === "caught" && (
                        <span className="font-mono text-sm tabular-nums text-success">
                          +7
                        </span>
                      )}
                      {flag.status === "cleared" && (
                        <span className="font-mono text-sm tabular-nums text-destructive">
                          −2
                        </span>
                      )}
                      <FlagStatusBadge status={flag.status} />
                    </div>
                  </div>
                  {!flag.selfReport && (
                    <p className="text-sm leading-relaxed text-foreground/80">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Your guess —{" "}
                      </span>
                      {flag.guess}
                    </p>
                  )}
                  {flag.auditReason && (
                    <p className="border-l border-border/80 pl-3 text-sm italic leading-relaxed text-muted-foreground">
                      {flag.auditReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Flags against me */}
        {flagsAgainstMe.length > 0 && (
          <Section
            title="Flags against you"
            count={flagsAgainstMe.length}
            tone="danger"
          >
            <ul className="divide-y divide-border/70 border-t border-b border-border/70">
              {flagsAgainstMe.map((flag) => (
                <li key={flag._id} className="space-y-3 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14px] text-muted-foreground">
                      {flag.selfReport ? (
                        <>
                          Self-reported — caught by{" "}
                          <span className="font-medium text-foreground">
                            {flag.monitorId?.name ?? "Unknown"}
                          </span>
                        </>
                      ) : (
                        <>
                          Flagged by{" "}
                          <span className="font-medium text-foreground">
                            {flag.monitorId?.name ?? "Unknown"}
                          </span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      {flag.status === "caught" && (
                        <span className="font-mono text-sm tabular-nums text-destructive">
                          −1
                        </span>
                      )}
                      <FlagStatusBadge status={flag.status} />
                    </div>
                  </div>
                  {!flag.selfReport && (
                    <p className="text-sm leading-relaxed text-foreground/85">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Their guess —{" "}
                      </span>
                      {flag.guess}
                    </p>
                  )}
                  {flag.auditReason && (
                    <p className="border-l border-destructive/40 pl-3 text-sm italic leading-relaxed text-muted-foreground">
                      {flag.auditReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <RerollConfirmModal
        open={showRerollConfirm}
        currentTask={player.sideTask}
        rerollsRemaining={player.sideTaskRerollsRemaining ?? 0}
        rerolling={rerolling}
        onConfirm={confirmReroll}
        onCancel={() => {
          if (!rerolling) setShowRerollConfirm(false);
        }}
      />
    </main>
  );
}

function Section({
  title,
  subtitle,
  count,
  tone,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  count?: number;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  const titleColor =
    tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className={`font-serif text-2xl tracking-tight ${titleColor}`}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {typeof count === "number" && (
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function RerollConfirmModal({
  open,
  currentTask,
  rerollsRemaining,
  rerolling,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  currentTask: string | null;
  rerollsRemaining: number;
  rerolling: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !rerolling) onCancel();
      if (e.key === "Enter" && !rerolling) onConfirm();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, rerolling, onCancel, onConfirm]);

  if (!open) return null;

  const paid = rerollsRemaining <= 0;
  const remainingAfter = Math.max(0, rerollsRemaining - 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reroll-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        disabled={rerolling}
        className="absolute inset-0 cursor-default bg-foreground/30 backdrop-blur-[2px] animate-fade-in-up"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-md border border-border bg-card shadow-xl animate-fade-in-up">
        <div className="space-y-4 px-6 pt-6 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Confirm action
            </p>
            <h3
              id="reroll-title"
              className="mt-1 font-serif text-2xl tracking-tight text-foreground"
            >
              {paid ? "Pay 1 point to reroll?" : "Reroll your side task?"}
            </h3>
          </div>

          <p className="text-[14.5px] leading-relaxed text-muted-foreground">
            {paid ? (
              <>
                You&apos;re out of free rerolls. Confirming costs{" "}
                <span className="font-medium text-destructive">1 point</span>{" "}
                and gives you the next available side task. The current one is
                discarded.
              </>
            ) : (
              <>
                You&apos;ll be given the next available side task. Your current
                one will be discarded and cannot be recovered.
              </>
            )}
          </p>

          {currentTask && (
            <div className="rounded-md border border-border bg-paper-soft px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Current task
              </p>
              <p className="mt-1 line-clamp-3 text-[14px] leading-relaxed text-foreground/85">
                {currentTask}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-paper-soft px-4 py-3">
            {paid ? (
              <>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Free rerolls
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-mono tabular-nums text-foreground">
                      0
                    </span>{" "}
                    of <span className="font-mono tabular-nums">3</span>{" "}
                    remaining
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Cost
                  </p>
                  <p className="mt-1 font-serif text-2xl tabular-nums text-destructive">
                    −1
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Rerolls remaining
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-mono tabular-nums text-foreground">
                      {rerollsRemaining}
                    </span>{" "}
                    of <span className="font-mono tabular-nums">3</span> for
                    the night
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    After this
                  </p>
                  <p className="mt-1 font-serif text-2xl tabular-nums text-brand">
                    {remainingAfter}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-paper-soft px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={rerolling}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={rerolling}
            size="sm"
          >
            {rerolling
              ? "Rerolling…"
              : paid
                ? "Pay & reroll"
                : "Reroll task"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TaskSection({
  title,
  subtitle,
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
  onReroll,
  rerolling,
  rerollsRemaining,
}: {
  title: string;
  subtitle: string;
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
  onReroll?: () => void;
  rerolling?: boolean;
  rerollsRemaining?: number;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            {subtitle}
          </p>
        </div>
        {isPending && (
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground/70">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Awaiting verification
          </span>
        )}
        {isFailed && (
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            Caught
          </span>
        )}
      </div>

      <div className="border border-border bg-card p-5 sm:p-6">
        <p className="font-serif text-[19px] leading-snug text-foreground">
          {task ?? "—"}
        </p>

        {canRequest && !isPending && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button onClick={onRequest} disabled={isCompleting}>
              {isCompleting ? "Submitting…" : "Request verification"}
            </Button>
            {onReroll && typeof rerollsRemaining === "number" && (
              <Button
                onClick={onReroll}
                disabled={rerolling}
                variant="ghost"
                size="sm"
                title={
                  rerollsRemaining <= 0
                    ? "Pay 1 point for another reroll"
                    : "Get a new side task"
                }
              >
                {rerolling
                  ? "Rerolling…"
                  : rerollsRemaining <= 0
                    ? "Reroll (−1 pt)"
                    : `Reroll (${rerollsRemaining} left)`}
              </Button>
            )}
            {onSelfReport && !showSelfReportPicker && (
              <Button
                onClick={onSelfReport}
                disabled={selfReporting}
                variant="ghost"
                size="sm"
                className="text-destructive/80 hover:text-destructive"
              >
                Somebody caught me
              </Button>
            )}
          </div>
        )}

        {showSelfReportPicker && (
          <div className="mt-5">
            <SelfReportPicker
              players={selfReportPlayers ?? []}
              selfReporting={!!selfReporting}
              onSelect={(id) => onSelfReportSelect?.(id)}
              onCancel={() => onSelfReportCancel?.()}
            />
          </div>
        )}

        {isPending && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              Show this QR code to another player so they can verify your task.
            </p>
            {qrDataUrl && (
              <div className="mt-4 flex justify-center">
                <img
                  src={qrDataUrl}
                  alt="Verification QR code"
                  className="h-52 w-52"
                />
              </div>
            )}
            <p className="mt-3 break-all text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {profileUrl}
            </p>
            <div className="mt-3 flex justify-center">
              <Button
                onClick={onCancel}
                disabled={canceling}
                variant="ghost"
                size="sm"
              >
                {canceling ? "Canceling…" : "Cancel request"}
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
    <div className="space-y-3 border-l-2 border-destructive bg-destructive/5 px-4 py-4">
      <p className="text-[14px] text-foreground">
        <span className="font-medium text-destructive">Who caught you?</span>{" "}
        <span className="text-muted-foreground">
          (they get +7, you get −1)
        </span>
      </p>
      <Input
        type="search"
        placeholder={`Search ${players.length || ""} players by name…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={selfReporting}
        autoComplete="off"
      />
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">
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
              >
                {p.name}
              </Button>
            ))}
          </div>
        )}
      </div>
      {selfReporting && (
        <p className="text-sm text-muted-foreground">Reporting…</p>
      )}
      <Button onClick={onCancel} variant="ghost" size="sm">
        Cancel
      </Button>
    </div>
  );
}

function FlagStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Pending
        </span>
      );
    case "cleared":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Cleared
        </span>
      );
    case "caught":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          Caught
        </span>
      );
    default:
      return (
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {status}
        </span>
      );
  }
}
