import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, assertDb } from "@/db";
import { stories } from "@/db/schema";
import { analyzeStory } from "@/lib/analysis/analyst";
import { minePatterns } from "@/lib/analysis/miner";
import { requireUserId } from "@/lib/auth";

export const maxDuration = 300;

/**
 * Dev/manual trigger: analyze all of the current user's unanalyzed
 * stories and run the pattern miner. Used after seeding, and handy for
 * "run the pipeline now" during evaluation.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_ROUTES) {
    return new Response("Not available in production", { status: 403 });
  }
  assertDb();
  const userId = await requireUserId();

  const unanalyzed = await db
    .select({ id: stories.id })
    .from(stories)
    .where(and(eq(stories.userId, userId), isNull(stories.analyzedAt)));

  for (const story of unanalyzed) {
    await analyzeStory(story.id);
  }
  await minePatterns(userId);

  return NextResponse.json({ analyzed: unanalyzed.length, mined: true });
}
