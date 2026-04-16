import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { sessionOptions, SessionData } from "@/lib/session";

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

  target.sideTaskPendingVerification = false;
  target.sideTaskCompleted = true;
  target.score += 1;
  await target.save();

  return NextResponse.json({
    success: true,
    playerName: target.name,
    newScore: target.score,
  });
}
