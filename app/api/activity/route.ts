import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Activity } from "@/lib/models/Activity";

export async function GET() {
  await connectDB();

  const activities = await Activity.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({ activities });
}
