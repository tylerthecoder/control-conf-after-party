import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { sessionOptions, SessionData } from "@/lib/session";

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

  if (player.sideTaskCompleted) {
    return NextResponse.json(
      { error: "Task already completed" },
      { status: 400 }
    );
  }

  if (player.sideTaskPendingVerification) {
    return NextResponse.json(
      { error: "Task already pending verification" },
      { status: 400 }
    );
  }

  if (player.sideTaskFailed) {
    return NextResponse.json(
      { error: "Task was caught — cannot complete" },
      { status: 400 }
    );
  }

  player.sideTaskPendingVerification = true;
  await player.save();

  return NextResponse.json({ success: true, pendingVerification: true });
}
