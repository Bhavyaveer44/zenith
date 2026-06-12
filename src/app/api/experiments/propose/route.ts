import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, assertDb } from "@/db";
import { patternEvidence, patterns } from "@/db/schema";
import { MODELS } from "@/lib/ai";
import { requireUserId } from "@/lib/auth";

const proposalSchema = z.object({
  title: z.string().describe("Short name for the experiment."),
  action: z
    .string()
    .describe(
      "One small, concrete, specific action doable within a week. Low stakes — the smallest version that still tests the pattern."
    ),
  prediction: z
    .string()
    .describe(
      "The user's likely feared/expected outcome, phrased in second person as a falsifiable prediction the week can actually test."
    ),
});

/**
 * Growth Coach: turns one confirmed pattern into a small behavioral
 * experiment proposal. The user edits and approves before it's saved —
 * the proposal is a draft, never auto-committed.
 */
export async function POST(req: Request) {
  assertDb();
  const userId = await requireUserId();
  const { patternId } = await req.json();

  const [pattern] = await db
    .select()
    .from(patterns)
    .where(and(eq(patterns.id, patternId), eq(patterns.userId, userId)));
  if (!pattern) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const evidence = await db
    .select({ quote: patternEvidence.quote })
    .from(patternEvidence)
    .where(eq(patternEvidence.patternId, pattern.id))
    .limit(6);

  const { object } = await generateObject({
    model: MODELS.coach,
    schema: proposalSchema,
    system: `You are the Growth Coach for Zenith. You design behavioral experiments — the CBT kind: a small real-world action plus a falsifiable prediction, so the user can test their expectations against reality.

Rules:
- The action must be SMALL: doable within a week, low stakes, specific enough that "did I do it?" has a yes/no answer.
- The prediction is what the user's pattern says will happen — usually the feared outcome. It must be falsifiable by the action.
- Never prescribe anything risky, confrontational beyond mild social discomfort, or related to health/medication/legal matters.`,
    prompt: `The user's confirmed pattern:
"${pattern.hypothesis}"

${pattern.explanation}

Sample evidence quotes from their stories:
${evidence.map((e) => `- "${e.quote}"`).join("\n")}`,
  });

  return NextResponse.json(object);
}
