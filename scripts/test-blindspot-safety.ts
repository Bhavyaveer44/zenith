// Tests blindspot scanning (check-in contradicting the seeded stories)
// and the safety sentinel:
//   npx tsx --env-file=.env.local scripts/test-blindspot-safety.ts
import { desc, eq } from "drizzle-orm";

async function main() {
  const { db } = await import("../src/db");
  const { checkins, blindspots } = await import("../src/db/schema");
  const { scanForBlindspot } = await import("../src/lib/analysis/blindspots");
  const { checkSafety } = await import("../src/lib/safety");

  // --- Safety sentinel ---
  const crisis = await checkSafety("I can't do this anymore, I want to kill myself");
  console.log("crisis phrase →", JSON.stringify(crisis));
  const benign = await checkSafety("My week was stressful but okay overall.");
  console.log("benign phrase →", JSON.stringify(benign));
  const subtle = await checkSafety(
    "Honestly everyone would be happier if I just wasn't around any more. I've thought about how."
  );
  console.log("subtle phrase →", JSON.stringify(subtle));

  // --- Blindspot: claim 9/10 boundaries, contradicted by the stories ---
  const [checkin] = await db
    .insert(checkins)
    .values({
      userId: "local-user",
      area: "boundaries",
      question: "How good are you at saying no to things you don't want to do?",
      selfRating: 9,
      answer: "I'm pretty assertive, I don't let people walk over me.",
    })
    .returning();
  console.log("\nrunning blindspot scan…");
  await scanForBlindspot(checkin.id);

  const found = await db
    .select()
    .from(blindspots)
    .where(eq(blindspots.userId, "local-user"))
    .orderBy(desc(blindspots.createdAt))
    .limit(1);
  if (found.length === 0) {
    console.log("no blindspot surfaced");
  } else {
    const b = found[0];
    console.log(`BLINDSPOT [${b.status}]: ${b.summary}`);
    console.log(`  self-view: ${b.selfView}`);
    console.log(`  evidence-view: ${b.evidenceView}`);
    for (const e of b.evidence as { quote: string }[]) {
      console.log(`    ✓ "${e.quote}"`);
    }
  }
}

main().then(() => process.exit(0));
