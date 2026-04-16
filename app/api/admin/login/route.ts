import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ success: true });
}
