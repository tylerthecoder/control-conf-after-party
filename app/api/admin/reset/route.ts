import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { Flag } from "@/lib/models/Flag";
import { GameState } from "@/lib/models/GameState";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  await Promise.all([
    Player.deleteMany({}),
    Flag.deleteMany({}),
    GameState.findByIdAndUpdate(
      "game",
      { status: "inactive", startedAt: null },
      { upsert: true }
    ),
  ]);

  return NextResponse.json({ success: true });
}
