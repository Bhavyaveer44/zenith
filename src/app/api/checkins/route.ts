import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { db, assertDb } from "@/db";
import { checkins } from "@/db/schema";
import { scanForBlindspot } from "@/lib/analysis/blindspots";
import { requireUserId } from "@/lib/auth";

const bodySchema = z.object({
  area: z.string().min(1),
  question: z.string().min(1),
  selfRating: z.number().int().min(1).max(10),
  answer: z.string().optional(),
});

export async function POST(req: Request) {
  assertDb();
  const userId = await requireUserId();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const [row] = await db
    .insert(checkins)
    .values({ userId, ...parsed.data })
    .returning();

  // Blindspot scan runs in the background; results appear on the Mirror page.
  after(async () => {
    try {
      await scanForBlindspot(row.id);
    } catch (err) {
      console.error("blindspot scan failed", row.id, err);
    }
  });

  return NextResponse.json({ ok: true, id: row.id });
}
