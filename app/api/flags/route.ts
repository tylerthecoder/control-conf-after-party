import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { Flag } from "@/lib/models/Flag";
import { Activity } from "@/lib/models/Activity";
import { sessionOptions, SessionData } from "@/lib/session";
import { auditFlag } from "@/lib/auditor";
import { pickNextSideTask } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();

  const monitor = await Player.findById(session.playerId);
  if (!monitor) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const { targetId, guess } = await req.json();

  if (!targetId || !guess?.trim()) {
    return NextResponse.json(
      { error: "Target and guess are required" },
      { status: 400 }
    );
  }

  if (targetId === session.playerId) {
    return NextResponse.json(
      { error: "You can't flag yourself" },
      { status: 400 }
    );
  }

  const target = await Player.findById(targetId);
  if (!target) {
    return NextResponse.json(
      { error: "Target player not found" },
      { status: 404 }
    );
  }

  const result = await auditFlag(guess.trim(), target.sideTask!);

  const flag = await Flag.create({
    monitorId: session.playerId,
    targetId,
    guess: guess.trim(),
    status: result.verdict,
    auditReason: result.reason,
  });

  if (result.verdict === "caught") {
    const priorCompleted: string[] = target.completedSideTasks ?? [];
    const nextTask = pickNextSideTask(
      [...priorCompleted, target.sideTask].filter(
        (t): t is string => Boolean(t)
      ),
      target.sideTask
    );

    await Player.findByIdAndUpdate(target._id, {
      $set: {
        sideTask: nextTask,
        sideTaskFailed: false,
        sideTaskCompleted: false,
        sideTaskPendingVerification: false,
      },
      $inc: { score: -1 },
    });

    monitor.score += 3;
    await monitor.save();
  } else {
    monitor.score -= 2;
    await monitor.save();
  }

  await Activity.create({
    type: result.verdict === "caught" ? "flag_caught" : "flag_cleared",
    playerName: monitor.name,
    targetName: target.name,
    guess: guess.trim(),
    reason: result.reason,
    task: result.verdict === "caught" ? target.sideTask : null,
  });

  return NextResponse.json({
    success: true,
    flagId: flag._id,
    verdict: result.verdict,
    reason: result.reason,
  });
}
