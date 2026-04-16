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

  const body = await req.json().catch(() => ({}));
  const taskType: "main" | "side" = body.taskType === "main" ? "main" : "side";

  await connectDB();

  const player = await Player.findById(session.playerId);
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  if (taskType === "main") {
    if (player.mainTaskPendingVerification) {
      return NextResponse.json(
        { error: "Main task already pending verification" },
        { status: 400 }
      );
    }
    player.mainTaskPendingVerification = true;
  } else {
    if (player.sideTaskPendingVerification) {
      return NextResponse.json(
        { error: "Side task already pending verification" },
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
  }

  await player.save();

  return NextResponse.json({ success: true, taskType, pendingVerification: true });
}
