import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Player } from "@/lib/models/Player";

export async function GET() {
  await connectDB();
  const players = await Player.find({}).sort({ score: -1, createdAt: 1 }).lean();
  return NextResponse.json(players);
}
