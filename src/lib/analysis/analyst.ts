import { generateObject } from "ai";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { observations, profiles, stories } from "@/db/schema";
import { MODELS } from "@/lib/ai";
import { embedTexts } from "./embeddings";
import { minePatterns } from "./miner";

const extractionSchema = z.object({
  observations: z
    .array(
      z.object({
        kind: z.enum([
          "trigger",
          "emotion",
          "thought",
          "behavior",
          "outcome",
          "person",
        ]),
        content: z
          .string()
          .describe(
            "A neutral, third-person description of the observation, e.g. 'Agreed to extra work despite feeling resentful'."
          ),
        quote: z
          .string()
          .describe(
            "The exact phrase from the story this observation is grounded in. Must be a verbatim substring-level quote, not a paraphrase."
          ),
      })
    )
    .max(15),
});

/**
 * Story Analyst: decomposes one saved story into structured, quoted
 * observations and embeds them for clustering. Triggers pattern mining
 * after every 3rd analyzed story.
 */
export async function analyzeStory(storyId: string): Promise<void> {
  const [story] = await db
    .select()
    .from(stories)
    .where(eq(stories.id, storyId));
  if (!story || story.analyzedAt) return;

  const { object } = await generateObject({
    model: MODELS.analyst,
    schema: extractionSchema,
    system: `You are the Story Analyst for Zenith, a structured self-reflection tool.
Decompose the user's story into discrete observations. Rules:
- Every observation MUST be grounded in a verbatim quote from the story. If you cannot quote it, do not record it.
- Record only what is IN the story. Never infer diagnoses, childhood causes, or anything not stated.
- kinds: trigger (what set the situation off), emotion (a named feeling), thought (an automatic thought, ideally verbatim), behavior (what the user actually did), outcome (how it ended / consequences), person (a relationship dynamic with a specific person role, e.g. 'manager', 'mother').
- Prefer fewer, well-grounded observations over many speculative ones.`,
    prompt: `Story title: ${story.title}\n\nStory:\n${story.narrative}`,
  });

  const items = object.observations.filter((o) => o.quote.trim().length > 0);
  if (items.length > 0) {
    // Embeddings are optional: without gateway access (e.g. Groq-only
    // setups) the miner falls back to LLM-based clustering.
    let embeddings: (number[] | null)[] = items.map(() => null);
    try {
      embeddings = await embedTexts(items.map((o) => `${o.kind}: ${o.content}`));
    } catch (err) {
      console.warn("embeddings unavailable, storing observations without", err);
    }
    await db.insert(observations).values(
      items.map((o, i) => ({
        userId: story.userId,
        storyId: story.id,
        kind: o.kind,
        content: o.content,
        quote: o.quote,
        embedding: embeddings[i],
      }))
    );
  }

  await db
    .update(stories)
    .set({ analyzedAt: new Date() })
    .where(eq(stories.id, storyId));

  // Mining trigger: every 3rd analyzed story.
  await db
    .insert(profiles)
    .values({ userId: story.userId, storiesSinceMining: 1 })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        storiesSinceMining: sql`${profiles.storiesSinceMining} + 1`,
      },
    });
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, story.userId));
  if (profile && profile.storiesSinceMining >= 3) {
    await db
      .update(profiles)
      .set({ storiesSinceMining: 0 })
      .where(eq(profiles.userId, story.userId));
    await minePatterns(story.userId);
  }
}
