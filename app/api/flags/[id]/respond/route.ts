import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { Flag } from "@/lib/models/Flag";
import { sessionOptions, SessionData } from "@/lib/session";
import { auditFlag } from "@/lib/auditor";
import { sideTasks } from "@/lib/tasks";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();

  const flag = await Flag.findById(id);
  if (!flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  if (flag.targetId.toString() !== session.playerId) {
    return NextResponse.json(
      { error: "This flag isn't against you" },
      { status: 403 }
    );
  }

  if (flag.status !== "pending_justification") {
    return NextResponse.json(
      { error: "Already responded to this flag" },
      { status: 400 }
    );
  }

  const { justification } = await req.json();

  if (!justification?.trim()) {
    return NextResponse.json(
      { error: "Justification is required" },
      { status: 400 }
    );
  }

  flag.justification = justification.trim();
  flag.status = "pending_audit";
  await flag.save();

  const result = await auditFlag(flag.observation, flag.justification!);

  flag.status = result.verdict;
  flag.auditReason = result.reason;
  await flag.save();

  const monitor = await Player.findById(flag.monitorId);
  const target = await Player.findById(flag.targetId);

  if (result.verdict === "caught") {
    if (target) {
      const priorCompleted: string[] = target.completedSideTasks ?? [];
      const usedTasks = new Set([...priorCompleted, target.sideTask]);
      const availableTasks = sideTasks.filter((t) => !usedTasks.has(t));
      const nextTask =
        availableTasks.length > 0
          ? availableTasks[Math.floor(Math.random() * availableTasks.length)]
          : sideTasks[Math.floor(Math.random() * sideTasks.length)];

      await Player.findByIdAndUpdate(target._id, {
        $set: {
          sideTask: nextTask,
          sideTaskFailed: false,
          sideTaskCompleted: false,
          sideTaskPendingVerification: false,
        },
        $inc: { score: -1 },
      });
    }
    if (monitor) {
      monitor.score += 3;
      await monitor.save();
    }
  } else {
    if (monitor) {
      monitor.score -= 2;
      await monitor.save();
    }
  }

  return NextResponse.json({
    success: true,
    verdict: result.verdict,
    reason: result.reason,
  });
}
