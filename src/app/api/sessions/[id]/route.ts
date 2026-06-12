import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, assertDb } from "@/db";
import { sessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { getProtocol, stepIndex } from "@/lib/protocols";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  assertDb();
  const userId = await requireUserId();
  const { id } = await params;
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const protocol = getProtocol(session.protocolId);
  if (!protocol) {
    return NextResponse.json({ error: "Unknown protocol" }, { status: 500 });
  }
  return NextResponse.json({
    id: session.id,
    status: session.status,
    summary: session.summary,
    messages: session.messages,
    protocol: {
      id: protocol.id,
      name: protocol.name,
      evidenceBase: protocol.evidenceBase,
      steps: protocol.steps.map((s) => ({ id: s.id, title: s.title })),
    },
    currentStepId: session.currentStepId,
    currentStepIndex: stepIndex(protocol, session.currentStepId),
  });
}
