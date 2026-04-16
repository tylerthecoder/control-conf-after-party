import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";
import { Flag } from "@/lib/models/Flag";
import { sessionOptions, SessionData } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();

  const player = await Player.findById(session.playerId).lean();
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const flagsAgainstMe = await Flag.find({ targetId: session.playerId })
    .populate("monitorId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const flagsByMe = await Flag.find({ monitorId: session.playerId })
    .populate("targetId", "name")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ player, flagsAgainstMe, flagsByMe });
}
