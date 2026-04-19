import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { Flag } from "@/lib/models/Flag";
import { Activity } from "@/lib/models/Activity";
import { sessionOptions, SessionData } from "@/lib/session";
import { pickNextSideTask } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { catcherId } = await req.json().catch(() => ({}));

  if (!catcherId) {
    return NextResponse.json(
      { error: "Must specify who caught you" },
      { status: 400 }
    );
  }

  if (catcherId === session.playerId) {
    return NextResponse.json(
      { error: "You can't report yourself as the catcher" },
      { status: 400 }
    );
  }

  await connectDB();

  const [player, catcher] = await Promise.all([
    Player.findById(session.playerId),
    Player.findById(catcherId),
  ]);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
  if (!catcher) {
    return NextResponse.json({ error: "Catcher not found" }, { status: 404 });
  }
  if (!player.sideTask) {
    return NextResponse.json(
      { error: "No side task assigned" },
      { status: 400 }
    );
  }

  const caughtTask = player.sideTask;

  await Flag.create({
    monitorId: catcherId,
    targetId: session.playerId,
    guess: "(self-reported)",
    selfReport: true,
    status: "caught",
    auditReason: `${player.name} admitted that ${catcher.name} caught them.`,
  });

  const priorCompleted: string[] = player.completedSideTasks ?? [];
  const nextTask = pickNextSideTask(
    [...priorCompleted, caughtTask],
    caughtTask
  );

  await Player.findByIdAndUpdate(player._id, {
    $set: {
      sideTask: nextTask,
      sideTaskFailed: false,
      sideTaskCompleted: false,
      sideTaskPendingVerification: false,
    },
    $inc: { score: -1 },
  });

  catcher.score += 7;
  await catcher.save();

  await Activity.create({
    type: "flag_caught",
    playerName: catcher.name,
    targetName: player.name,
    guess: "(self-reported)",
    reason: `${player.name} admitted that ${catcher.name} caught them.`,
    task: caughtTask,
  });

  return NextResponse.json({
    success: true,
    catcherName: catcher.name,
    newScore: player.score - 1,
  });
}
