import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { getGameState } from "@/lib/models/GameState";
import { sessionOptions, SessionData } from "@/lib/session";
import { mainTasks, sideTasks } from "@/lib/tasks";

export async function POST(req: NextRequest) {
  try {
    const { name, deviceToken } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await connectDB();

    const gameState = await getGameState();
    if (gameState.status !== "active") {
      return NextResponse.json(
        { error: "Party hasn't started yet" },
        { status: 403 }
      );
    }

    const trimmedName = name.trim();

    let player = await Player.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (player) {
      if (player.deviceToken && player.deviceToken !== deviceToken) {
        return NextResponse.json(
          { error: "This name is already taken by another device" },
          { status: 403 }
        );
      }
      if (!player.deviceToken && deviceToken) {
        player.deviceToken = deviceToken;
        await player.save();
      }
    } else {
      const mainTask =
        mainTasks[Math.floor(Math.random() * mainTasks.length)];

      const assignedSideTasks = await Player.find({
        sideTask: { $ne: null },
      }).distinct("sideTask");
      const assignedSet = new Set(assignedSideTasks);
      const sideTask =
        sideTasks.find((t) => !assignedSet.has(t)) ?? sideTasks[0];

      player = await Player.create({
        name: trimmedName,
        role: "monitor",
        deviceToken: deviceToken || null,
        mainTask,
        sideTask,
        flagsRemaining: 3,
      });
    }

    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );
    session.playerId = player._id.toString();
    session.name = player.name;
    session.role = player.role;
    await session.save();

    return NextResponse.json({
      success: true,
      playerId: player._id,
      name: player.name,
      role: player.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
