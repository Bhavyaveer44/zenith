import { NextResponse } from "next/server";
import { db, assertDb } from "@/db";
import { profiles } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export async function POST(req: Request) {
  assertDb();
  const userId = await requireUserId();
  const { displayName } = await req.json().catch(() => ({ displayName: null }));
  await db
    .insert(profiles)
    .values({ userId, displayName, consentAt: new Date() })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { consentAt: new Date(), ...(displayName ? { displayName } : {}) },
    });
  return NextResponse.json({ ok: true });
}
