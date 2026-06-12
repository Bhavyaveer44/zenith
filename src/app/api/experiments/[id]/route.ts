import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, assertDb } from "@/db";
import { experiments } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

const patchSchema = z.object({
  status: z.enum(["completed", "abandoned"]),
  outcome: z.string().optional(),
  reflection: z.string().optional(),
  predictionCameTrue: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  assertDb();
  const userId = await requireUserId();
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const [updated] = await db
    .update(experiments)
    .set({
      status: parsed.data.status,
      outcome: parsed.data.outcome,
      reflection: parsed.data.reflection,
      predictionCameTrue: parsed.data.predictionCameTrue,
      completedAt: new Date(),
    })
    .where(and(eq(experiments.id, id), eq(experiments.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
