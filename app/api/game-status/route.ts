import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getGameState } from "@/lib/models/GameState";

export async function GET() {
  await connectDB();
  const state = await getGameState();
  return NextResponse.json({ active: state.status === "active" });
}
