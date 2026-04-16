import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { Flag } from "@/lib/models/Flag";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();

  const monitor = await Player.findById(session.playerId);
  if (!monitor) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const { targetId, guess } = await req.json();

  if (!targetId || !guess?.trim()) {
    return NextResponse.json(
      { error: "Target and guess are required" },
      { status: 400 }
    );
  }

  if (targetId === session.playerId) {
    return NextResponse.json(
      { error: "You can't flag yourself" },
      { status: 400 }
    );
  }

  const target = await Player.findById(targetId);
  if (!target) {
    return NextResponse.json(
      { error: "Target player not found" },
      { status: 404 }
    );
  }

  const flag = await Flag.create({
    monitorId: session.playerId,
    targetId,
    guess: guess.trim(),
  });

  return NextResponse.json({ success: true, flagId: flag._id });
}
