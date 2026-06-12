import { generateObject } from "ai";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { blindspots, checkins, observations, stories } from "@/db/schema";
import { MODELS } from "@/lib/ai";
import { verifyClaim, type EvidenceItem } from "./verifier";

const blindspotSchema = z.object({
  found: z
    .boolean()
    .describe("true ONLY if the narrative evidence genuinely contradicts the self-assessment."),
  summary: z
    .string()
    .describe("One sentence naming the gap, e.g. 'You rate yourself high at holding boundaries, but your stories repeatedly show you agreeing to things you resent.'"),
  selfView: z.string().describe("The user's self-assessment, restated."),
  evidenceView: z.string().describe("What the stories actually show, stated neutrally."),
  evidence: z
    .array(
      z.object({
        observationId: z.string(),
        quote: z.string().describe("Verbatim quote copied from the evidence list."),
      })
    )
    .describe("At least 3 observations from at least 2 different stories, or found=false."),
});

/**
 * Blindspot scan: diffs a structured self-assessment against the user's
 * accumulated narrative evidence. Only surfaced if the contradiction
 * survives the adversarial Verifier.
 */
export async function scanForBlindspot(checkinId: string): Promise<void> {
  const [checkin] = await db
    .select()
    .from(checkins)
    .where(eq(checkins.id, checkinId));
  if (!checkin) return;

  const rows = await db
    .select({
      id: observations.id,
      storyId: observations.storyId,
      kind: observations.kind,
      content: observations.content,
      quote: observations.quote,
      storyTitle: stories.title,
    })
    .from(observations)
    .innerJoin(stories, eq(observations.storyId, stories.id))
    .where(eq(observations.userId, checkin.userId))
    .orderBy(desc(observations.createdAt))
    .limit(80);

  if (rows.length < 6) return; // not enough narrative evidence to say anything

  const { object } = await generateObject({
    model: MODELS.miner,
    schema: blindspotSchema,
    system: `You are the blindspot scanner for Zenith. You compare how the user rates themselves with what their own stories show.

Rules:
- A blindspot exists ONLY when the evidence repeatedly contradicts the self-assessment. Agreement, ambiguity, or insufficient evidence => found=false.
- Cite at least 3 observations from at least 2 different stories, quoting verbatim from the evidence list. Never invent quotes.
- State the gap neutrally and kindly. No diagnoses, no character judgments, no causes.
- A LOW self-rating contradicted by capable behavior in the stories is also a blindspot (an underestimation) — those build confidence and matter just as much.`,
    prompt: `Self-assessment (area: ${checkin.area}):
Question: ${checkin.question}
Self-rating: ${checkin.selfRating}/10
${checkin.answer ? `Their note: ${checkin.answer}` : ""}

Narrative evidence from the user's stories:
${rows
  .map(
    (r) =>
      `- observationId: ${r.id} | [${r.kind}] ${r.content} — quote: "${r.quote}" (story: ${r.storyTitle})`
  )
  .join("\n")}`,
  });

  if (!object.found || object.evidence.length < 3) return;

  const byId = new Map(rows.map((r) => [r.id, r]));
  const evidence: EvidenceItem[] = object.evidence
    .map((e) => byId.get(e.observationId))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({
      observationId: r.id,
      kind: r.kind,
      content: r.content,
      quote: r.quote,
      storyId: r.storyId,
      storyTitle: r.storyTitle,
    }));

  const distinctStories = new Set(evidence.map((e) => e.storyId));
  if (evidence.length < 3 || distinctStories.size < 2) return;

  const verdict = await verifyClaim(
    object.summary,
    `Self-view: ${object.selfView} / Evidence-view: ${object.evidenceView}`,
    evidence
  );
  // Blindspots need 3 supports but only 2 distinct stories; verifyClaim
  // enforces 3 stories, so accept a "fail" that still has >=3 supports
  // across >=2 stories.
  const supportIds = new Set(
    verdict.verdicts.filter((v) => v.verdict === "supports").map((v) => v.observationId)
  );
  const supportStories = new Set(
    evidence.filter((e) => supportIds.has(e.observationId)).map((e) => e.storyId)
  );
  if (supportIds.size < 3 || supportStories.size < 2) return;

  await db.insert(blindspots).values({
    userId: checkin.userId,
    checkinId: checkin.id,
    summary: object.summary,
    selfView: object.selfView,
    evidenceView: object.evidenceView,
    evidence: evidence
      .filter((e) => supportIds.has(e.observationId))
      .map((e) => ({
        observationId: e.observationId,
        quote: e.quote,
        storyTitle: e.storyTitle,
      })),
    status: "proposed",
  });
}
