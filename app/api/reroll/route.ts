import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { sessionOptions, SessionData } from "@/lib/session";
import { sideTasks } from "@/lib/tasks";

const MAX_REROLLS = 3;

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

  if (player.sideTaskPendingVerification) {
    return NextResponse.json(
      { error: "Cancel pending verification before rerolling" },
      { status: 400 }
    );
  }

  if (player.sideTaskFailed) {
    return NextResponse.json(
      { error: "You were already caught — cannot reroll" },
      { status: 400 }
    );
  }

  const remaining = player.sideTaskRerollsRemaining ?? MAX_REROLLS;
  if (remaining <= 0) {
    return NextResponse.json(
      { error: "No rerolls remaining" },
      { status: 400 }
    );
  }

  const used = new Set<string>([
    ...(player.completedSideTasks ?? []),
    ...(player.sideTask ? [player.sideTask] : []),
  ]);

  const available = sideTasks.filter((t) => !used.has(t));
  let nextTask: string;
  if (available.length > 0) {
    nextTask = available[Math.floor(Math.random() * available.length)];
  } else {
    const fallback = sideTasks.filter((t) => t !== player.sideTask);
    const pool = fallback.length > 0 ? fallback : sideTasks;
    nextTask = pool[Math.floor(Math.random() * pool.length)];
  }

  await Player.findByIdAndUpdate(player._id, {
    $set: {
      sideTask: nextTask,
      sideTaskRerollsRemaining: remaining - 1,
    },
  });

  return NextResponse.json({
    success: true,
    sideTask: nextTask,
    sideTaskRerollsRemaining: remaining - 1,
  });
}
