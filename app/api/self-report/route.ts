import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { sessionOptions, SessionData } from "@/lib/session";
import { sideTasks } from "@/lib/tasks";

export async function POST() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();

  const player = await Player.findById(session.playerId);
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  if (!player.sideTask) {
    return NextResponse.json(
      { error: "No side task assigned" },
      { status: 400 }
    );
  }

  const priorCompleted: string[] = player.completedSideTasks ?? [];
  const usedTasks = new Set([...priorCompleted, player.sideTask]);
  const availableTasks = sideTasks.filter((t) => !usedTasks.has(t));
  const nextTask =
    availableTasks.length > 0
      ? availableTasks[Math.floor(Math.random() * availableTasks.length)]
      : sideTasks[Math.floor(Math.random() * sideTasks.length)];

  await Player.findByIdAndUpdate(player._id, {
    $set: {
      sideTask: nextTask,
      sideTaskFailed: false,
      sideTaskCompleted: false,
      sideTaskPendingVerification: false,
    },
    $inc: { score: -1 },
  });

  return NextResponse.json({
    success: true,
    newScore: player.score - 1,
  });
}
