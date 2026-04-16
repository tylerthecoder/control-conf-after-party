import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Flag } from "@/lib/models/Flag";
import { sessionOptions, SessionData } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.playerId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await connectDB();

  const flag = await Flag.findById(id)
    .populate("monitorId", "name")
    .populate("targetId", "name")
    .lean();

  if (!flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  return NextResponse.json(flag);
}
