import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, assertDb } from "@/db";
import { sessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { getProtocol } from "@/lib/protocols";

export async function GET() {
  assertDb();
  const userId = await requireUserId();
  const rows = await db
    .select({
      id: sessions.id,
      protocolId: sessions.protocolId,
      status: sessions.status,
      summary: sessions.summary,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  assertDb();
  const userId = await requireUserId();
  const { protocolId } = await req.json();
  const protocol = getProtocol(protocolId);
  if (!protocol) {
    return NextResponse.json({ error: "Unknown protocol" }, { status: 400 });
  }

  // The opening message is part of the protocol definition — written by
  // humans, shown verbatim, never generated.
  const openingMessage = {
    id: "opening",
    role: "assistant",
    parts: [{ type: "text", text: protocol.opening }],
  };

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      protocolId: protocol.id,
      currentStepId: protocol.steps[0].id,
      messages: [openingMessage],
    })
    .returning();

  return NextResponse.json({ id: session.id });
}
