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
  if (!monitor || monitor.role !== "monitor") {
    return NextResponse.json(
      { error: "Only monitors can flag" },
      { status: 403 }
    );
  }

  if (monitor.flagsRemaining <= 0) {
    return NextResponse.json({ error: "No flags remaining" }, { status: 400 });
  }

  const { targetId, observation } = await req.json();

  if (!targetId || !observation?.trim()) {
    return NextResponse.json(
      { error: "Target and observation are required" },
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
    observation: observation.trim(),
  });

  monitor.flagsRemaining -= 1;
  await monitor.save();

  return NextResponse.json({ success: true, flagId: flag._id });
}
