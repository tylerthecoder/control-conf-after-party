import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const player = await Player.findById(id).select("name role mainTask mainTaskPendingVerification sideTask sideTaskPendingVerification sideTaskCompleted").lean();

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json(player);
}
