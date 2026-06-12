import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, assertDb } from "@/db";
import { experiments } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

const bodySchema = z.object({
  patternId: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  action: z.string().min(1),
  prediction: z.string().min(1),
});

export async function GET() {
  assertDb();
  const userId = await requireUserId();
  const rows = await db
    .select()
    .from(experiments)
    .where(eq(experiments.userId, userId))
    .orderBy(desc(experiments.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  assertDb();
  const userId = await requireUserId();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const [row] = await db
    .insert(experiments)
    .values({
      userId,
      patternId: parsed.data.patternId ?? null,
      title: parsed.data.title,
      action: parsed.data.action,
      prediction: parsed.data.prediction,
    })
    .returning();
  return NextResponse.json(row);
}
