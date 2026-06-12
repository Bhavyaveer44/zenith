import { generateObject } from "ai";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { observations, patternEvidence, patterns, stories } from "@/db/schema";
import { MODELS } from "@/lib/ai";
import { cosineSimilarity } from "./embeddings";
import { verifyClaim, type EvidenceItem } from "./verifier";

const SIMILARITY_THRESHOLD = 0.62;
const MAX_CLUSTERS_PER_RUN = 5;

interface ObsRow {
  id: string;
  storyId: string;
  kind: string;
  content: string;
  quote: string;
  embedding: number[] | null;
}

const llmClusterSchema = z.object({
  clusters: z
    .array(
      z.object({
        theme: z.string().describe("Short label for the recurring theme."),
        observationIds: z
          .array(z.string())
          .describe("IDs of observations that share this recurring theme."),
      })
    )
    .max(MAX_CLUSTERS_PER_RUN)
    .describe(
      "Only genuinely recurring themes: each cluster needs observations from at least 3 different stories. Return an empty array if nothing recurs."
    ),
});

/**
 * Fallback clustering when embeddings are unavailable (e.g. Groq-only
 * setups): one model call groups observations by recurring theme. The
 * same ≥3-observations / ≥3-stories bar and the Verifier still apply.
 */
async function clusterWithLlm(rows: ObsRow[]): Promise<ObsRow[][]> {
  if (rows.length < 3) return [];
  const capped = rows.slice(0, 150);
  const { object } = await generateObject({
    model: MODELS.miner,
    schema: llmClusterSchema,
    system:
      "You group observations extracted from a user's personal stories into recurring behavioral themes. A theme only counts if essentially the same trigger/response shows up in at least 3 DIFFERENT stories. Be conservative: no cluster is better than a forced one.",
    prompt: `Observations (id | story | kind | content):\n${capped
      .map((r) => `${r.id} | story:${r.storyId} | ${r.kind} | ${r.content}`)
      .join("\n")}`,
  });
  const byId = new Map(capped.map((r) => [r.id, r]));
  return object.clusters
    .map((c) =>
      c.observationIds
        .map((id) => byId.get(id))
        .filter((r): r is ObsRow => Boolean(r))
    )
    .filter((items) => items.length >= 3);
}

/** Greedy single-pass clustering over observation embeddings. */
function clusterObservations(rows: ObsRow[]): ObsRow[][] {
  const clusters: { centroid: number[]; items: ObsRow[] }[] = [];
  for (const row of rows) {
    if (!row.embedding) continue;
    let best: { cluster: (typeof clusters)[number]; sim: number } | null = null;
    for (const cluster of clusters) {
      const sim = cosineSimilarity(row.embedding, cluster.centroid);
      if (sim >= SIMILARITY_THRESHOLD && (!best || sim > best.sim)) {
        best = { cluster, sim };
      }
    }
    if (best) {
      best.cluster.items.push(row);
    } else {
      clusters.push({ centroid: row.embedding, items: [row] });
    }
  }
  return clusters.map((c) => c.items);
}

const minerSchema = z.object({
  worthRecording: z
    .boolean()
    .describe("false if this cluster is trivial, incoherent, or a duplicate of an existing pattern."),
  hypothesis: z
    .string()
    .describe(
      "The pattern stated as an observed behavioral regularity in second person, e.g. 'When someone you respect criticizes your work, you tend to agree immediately and revisit it for days afterward.' Never a diagnosis or character judgment."
    ),
  explanation: z
    .string()
    .describe("2-3 sentences on the recurring trigger->response->cost loop visible in the evidence."),
  confidence: z.number().min(0).max(1),
});

/**
 * Pattern Miner: clusters observations across all of a user's stories and
 * proposes pattern hypotheses. Every hypothesis must survive the Verifier
 * before it gets "verified" status (the only status the UI shows).
 */
export async function minePatterns(userId: string): Promise<void> {
  const rows = (await db
    .select({
      id: observations.id,
      storyId: observations.storyId,
      kind: observations.kind,
      content: observations.content,
      quote: observations.quote,
      embedding: observations.embedding,
    })
    .from(observations)
    .where(eq(observations.userId, userId))) as ObsRow[];

  // Skip observations already attached to a live pattern, so reruns
  // don't keep re-proposing the same thing.
  const existing = await db
    .select()
    .from(patterns)
    .where(eq(patterns.userId, userId));
  const livePatternIds = existing
    .filter((p) => ["candidate", "verified", "confirmed"].includes(p.status))
    .map((p) => p.id);
  const usedObservationIds = new Set<string>(
    livePatternIds.length > 0
      ? (
          await db
            .select({ observationId: patternEvidence.observationId })
            .from(patternEvidence)
            .where(inArray(patternEvidence.patternId, livePatternIds))
        ).map((r) => r.observationId)
      : []
  );

  const fresh = rows.filter((r) => !usedObservationIds.has(r.id));

  // Embedding-based clustering where embeddings exist; LLM-based
  // clustering for the rest (covers Groq-only setups with no embeddings).
  const withEmbedding = fresh.filter((r) => r.embedding);
  const withoutEmbedding = fresh.filter((r) => !r.embedding);
  const rawClusters = [
    ...clusterObservations(withEmbedding),
    ...(withoutEmbedding.length >= 3 ? await clusterWithLlm(withoutEmbedding) : []),
  ];

  const clusters = rawClusters
    .map((items) => ({
      items,
      storyCount: new Set(items.map((i) => i.storyId)).size,
    }))
    .filter((c) => c.items.length >= 3 && c.storyCount >= 3)
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, MAX_CLUSTERS_PER_RUN);

  if (clusters.length === 0) return;

  const storyRows = await db
    .select({ id: stories.id, title: stories.title })
    .from(stories)
    .where(eq(stories.userId, userId));
  const storyTitles = new Map(storyRows.map((s) => [s.id, s.title]));

  const existingHypotheses = existing
    .filter((p) => ["verified", "confirmed"].includes(p.status))
    .map((p) => `- ${p.hypothesis}`)
    .join("\n");

  for (const cluster of clusters) {
    const evidence: EvidenceItem[] = cluster.items.map((i) => ({
      observationId: i.id,
      kind: i.kind,
      content: i.content,
      quote: i.quote,
      storyId: i.storyId,
      storyTitle: storyTitles.get(i.storyId) ?? "Untitled",
    }));

    const { object: proposal } = await generateObject({
      model: MODELS.miner,
      schema: minerSchema,
      system: `You are the Pattern Miner for Zenith. You receive a cluster of observations that recur across several of the user's real stories, and you articulate the behavioral pattern they show — if there is one.

Rules:
- State only what the evidence shows: a regularity of trigger, response, and cost.
- Second person, concrete, non-judgmental. Never diagnose, never assign root causes, never make character judgments.
- If the cluster is trivial (e.g. "you feel emotions"), incoherent, or duplicates an existing pattern, set worthRecording=false.${
        existingHypotheses
          ? `\n\nExisting patterns (do not duplicate):\n${existingHypotheses}`
          : ""
      }`,
      prompt: `Observation cluster (each from a real story the user told):
${evidence
  .map((e) => `- [${e.kind}] ${e.content} — quote: "${e.quote}" (story: ${e.storyTitle}, id: ${e.observationId})`)
  .join("\n")}`,
    });

    if (!proposal.worthRecording) continue;

    const verdict = await verifyClaim(
      proposal.hypothesis,
      proposal.explanation,
      evidence
    );

    const [pattern] = await db
      .insert(patterns)
      .values({
        userId,
        hypothesis: proposal.hypothesis,
        explanation: proposal.explanation,
        status: verdict.overall === "pass" ? "verified" : "rejected",
        confidence: verdict.confidence,
        verifierNotes: verdict.notes,
      })
      .returning();

    const verdictMap = new Map(
      verdict.verdicts.map((v) => [v.observationId, v.verdict])
    );
    await db.insert(patternEvidence).values(
      evidence.map((e) => ({
        patternId: pattern.id,
        observationId: e.observationId,
        quote: e.quote,
        verdict: verdictMap.get(e.observationId) ?? "weak",
      }))
    );
  }
}
