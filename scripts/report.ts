// Print pipeline results: npx tsx --env-file=.env.local scripts/report.ts
import { and, eq, inArray } from "drizzle-orm";

async function main() {
  const { db } = await import("../src/db");
  const { patterns, patternEvidence, observations, stories } = await import(
    "../src/db/schema"
  );
  const userId = "local-user";

  const obs = await db
    .select({ id: observations.id })
    .from(observations)
    .where(eq(observations.userId, userId));
  const sts = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.userId, userId));
  console.log(`stories: ${sts.length}, observations: ${obs.length}`);

  const allPatterns = await db
    .select()
    .from(patterns)
    .where(eq(patterns.userId, userId));
  console.log(`patterns: ${allPatterns.length}\n`);

  for (const p of allPatterns) {
    console.log(`[${p.status.toUpperCase()}] conf=${p.confidence}`);
    console.log(`  ${p.hypothesis}`);
    console.log(`  verifier: ${p.verifierNotes}`);
    const ev = await db
      .select()
      .from(patternEvidence)
      .where(
        and(
          eq(patternEvidence.patternId, p.id),
          inArray(patternEvidence.verdict, ["supports"])
        )
      );
    console.log(`  supporting quotes: ${ev.length}`);
    for (const e of ev.slice(0, 5)) console.log(`    ✓ "${e.quote}"`);
    console.log();
  }
}

main().then(() => process.exit(0));
