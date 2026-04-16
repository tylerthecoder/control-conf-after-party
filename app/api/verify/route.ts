import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { sessionOptions, SessionData } from "@/lib/session";
import { sideTasks } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { playerId } = await req.json();

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  if (playerId === session.playerId) {
    return NextResponse.json(
      { error: "You can't verify your own task" },
      { status: 400 }
    );
  }

  await connectDB();

  const target = await Player.findById(playerId);
  if (!target) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  if (!target.sideTaskPendingVerification) {
    return NextResponse.json(
      { error: "This player has no task pending verification" },
      { status: 400 }
    );
  }

  if (target.sideTaskCompleted) {
    return NextResponse.json(
      { error: "Task already verified" },
      { status: 400 }
    );
  }

  const completedTask = target.sideTask!;
  const priorCompleted: string[] = target.completedSideTasks ?? [];
  const allCompleted = [...priorCompleted, completedTask];

  const usedTasks = new Set(allCompleted);
  const availableTasks = sideTasks.filter((t) => !usedTasks.has(t));
  const nextTask =
    availableTasks.length > 0
      ? availableTasks[Math.floor(Math.random() * availableTasks.length)]
      : sideTasks[Math.floor(Math.random() * sideTasks.length)];

  await Player.findByIdAndUpdate(target._id, {
    $push: { completedSideTasks: completedTask },
    $set: {
      sideTask: nextTask,
      sideTaskPendingVerification: false,
      sideTaskCompleted: false,
      sideTaskFailed: false,
    },
    $inc: { score: 1 },
  });

  return NextResponse.json({
    success: true,
    playerName: target.name,
    newScore: target.score + 1,
  });
}
