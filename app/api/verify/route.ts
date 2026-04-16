import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { sessionOptions, SessionData } from "@/lib/session";
import { mainTasks, sideTasks } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { playerId, taskType: requestedType } = await req.json();

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

  const taskType: "main" | "side" =
    requestedType === "main" ? "main" : "side";

  if (taskType === "main") {
    if (!target.mainTaskPendingVerification) {
      return NextResponse.json(
        { error: "This player has no main task pending verification" },
        { status: 400 }
      );
    }

    const completedTask = target.mainTask!;
    const priorCompleted: string[] = target.completedMainTasks ?? [];
    const allCompleted = [...priorCompleted, completedTask];

    const usedTasks = new Set(allCompleted);
    const availableTasks = mainTasks.filter((t) => !usedTasks.has(t));
    const nextTask =
      availableTasks.length > 0
        ? availableTasks[Math.floor(Math.random() * availableTasks.length)]
        : mainTasks[Math.floor(Math.random() * mainTasks.length)];

    await Player.findByIdAndUpdate(target._id, {
      $push: { completedMainTasks: completedTask },
      $set: {
        mainTask: nextTask,
        mainTaskPendingVerification: false,
      },
      $inc: { score: 1 },
    });

    return NextResponse.json({
      success: true,
      taskType: "main",
      playerName: target.name,
      points: 1,
      newScore: target.score + 1,
    });
  } else {
    if (!target.sideTaskPendingVerification) {
      return NextResponse.json(
        { error: "This player has no side task pending verification" },
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
      $inc: { score: 5 },
    });

    return NextResponse.json({
      success: true,
      taskType: "side",
      playerName: target.name,
      points: 5,
      newScore: target.score + 5,
    });
  }
}
