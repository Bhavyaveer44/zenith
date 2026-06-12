// Runs the full analysis pipeline for the local user without the dev
// server, then prints what the Verifier let through:
//   npx tsx --env-file=.env.local scripts/run-pipeline.ts

import { eq, isNull, and, inArray } from "drizzle-orm";

async function main() {
  const { db } = await import("../src/db");
  const { stories, patterns, patternEvidence, observations } = await import(
    "../src/db/schema"
  );
  const { analyzeStory } = await import("../src/lib/analysis/analyst");
  const { minePatterns } = await import("../src/lib/analysis/miner");

  const userId = "local-user";

  const unanalyzed = await db
    .select({ id: stories.id, title: stories.title })
    .from(stories)
    .where(and(eq(stories.userId, userId), isNull(stories.analyzedAt)));

  for (const story of unanalyzed) {
    console.log(`analyzing: ${story.title}`);
    await analyzeStory(story.id);
  }

  console.log("mining patterns…");
  await minePatterns(userId);

  const obsCount = await db
    .select({ id: observations.id })
    .from(observations)
    .where(eq(observations.userId, userId));
  console.log(`\nobservations extracted: ${obsCount.length}`);

  const allPatterns = await db
    .select()
    .from(patterns)
    .where(eq(patterns.userId, userId));

  for (const p of allPatterns) {
    console.log(`\n[${p.status.toUpperCase()}] (conf ${p.confidence})`);
    console.log(`  ${p.hypothesis}`);
    console.log(`  verifier: ${p.verifierNotes}`);
    const evidence = await db
      .select()
      .from(patternEvidence)
      .where(
        and(
          eq(patternEvidence.patternId, p.id),
          inArray(patternEvidence.verdict, ["supports"])
        )
      );
    for (const e of evidence) {
      console.log(`    ✓ "${e.quote}"`);
    }
  }
}

main().then(() => process.exit(0));
