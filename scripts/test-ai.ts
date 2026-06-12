// Quick connectivity check for the model paths:
//   npx tsx --env-file=.env.local scripts/test-ai.ts

import { embed, generateObject } from "ai";
import { z } from "zod";

async function main() {
  const { MODELS } = await import("../src/lib/ai");

  console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "set" : "not set");
  console.log("VERCEL_OIDC_TOKEN:", process.env.VERCEL_OIDC_TOKEN ? "set" : "not set");

  try {
    const { object } = await generateObject({
      model: MODELS.sentinel,
      schema: z.object({ category: z.enum(["none", "distress", "crisis"]) }),
      system: "Classify the message. Reply none unless there is danger.",
      prompt: "I had a long day at work.",
    });
    console.log("chat model OK:", object.category);
  } catch (err) {
    console.error("chat model FAILED:", (err as Error).message);
  }

  try {
    const { embedding } = await embed({
      model: MODELS.embedding,
      value: "hello world",
    });
    console.log("embedding OK, dims:", embedding.length);
  } catch (err) {
    console.error("embedding FAILED:", (err as Error).message);
  }
}

main();
