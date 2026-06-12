import { isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, assertDb } from "@/db";
import { stories } from "@/db/schema";
import { analyzeStory } from "@/lib/analysis/analyst";
import { minePatterns } from "@/lib/analysis/miner";

export const maxDuration = 300;

/**
 * Daily sweep (Vercel Cron): analyzes any stories that slipped through
 * the post-session background job, then mines patterns for every user
 * with unprocessed material.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  assertDb();

  const unanalyzed = await db
    .select({ id: stories.id, userId: stories.userId })
    .from(stories)
    .where(isNull(stories.analyzedAt))
    .limit(20);

  for (const story of unanalyzed) {
    try {
      await analyzeStory(story.id);
    } catch (err) {
      console.error("cron analyze failed", story.id, err);
    }
  }

  const userIds = [...new Set(unanalyzed.map((s) => s.userId))];
  for (const userId of userIds) {
    try {
      await minePatterns(userId);
    } catch (err) {
      console.error("cron mine failed", userId, err);
    }
  }

  return NextResponse.json({
    analyzed: unanalyzed.length,
    minedUsers: userIds.length,
  });
}
