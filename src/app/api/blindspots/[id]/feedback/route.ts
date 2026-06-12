import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, assertDb } from "@/db";
import { blindspots } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  assertDb();
  const userId = await requireUserId();
  const { id } = await params;
  const { action } = await req.json();
  if (action !== "confirm" && action !== "dismiss") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const [updated] = await db
    .update(blindspots)
    .set({ status: action === "confirm" ? "confirmed" : "dismissed" })
    .where(and(eq(blindspots.id, id), eq(blindspots.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, status: updated.status });
}
