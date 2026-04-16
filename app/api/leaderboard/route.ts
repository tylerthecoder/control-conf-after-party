import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";

export async function GET() {
  await connectDB();

  const players = await Player.find({})
    .select("name role score sideTaskCompleted sideTaskPendingVerification sideTaskFailed completedSideTasks mainTaskPendingVerification completedMainTasks flagsRemaining")
    .sort({ score: -1, createdAt: 1 })
    .lean();

  const allPlayers = players.map((p, i) => ({
    ...p,
    rank: i + 1,
  }));

  const monitors = allPlayers.filter((p) => p.role === "monitor");
  const regularPlayers = allPlayers.filter((p) => p.role === "player");

  return NextResponse.json({ all: allPlayers, monitors, players: regularPlayers });
}
