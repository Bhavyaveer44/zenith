import { generateObject } from "ai";
import { z } from "zod";
import { MODELS } from "@/lib/ai";

export type SafetyVerdict =
  | { level: "none" }
  | { level: "crisis"; source: "keyword" | "classifier"; trigger: string };

// Deterministic first pass. Intentionally high-recall: a false positive
// shows the user real resources, a false negative is unacceptable.
const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid\w*/i,
  /\bkill(?:ing)?\s+(?:myself|my\s*self)\b/i,
  /\bend(?:ing)?\s+(?:my|it\s+all|my\s+own)\s*(?:life)?\b/i,
  /\bend\s+my\s+life\b/i,
  /\b(?:want|wish|going|plan(?:ning)?)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(?:live|be\s+alive|exist|wake\s+up)\b/i,
  /\bbetter\s+off\s+(?:dead|without\s+me)\b/i,
  /\bself[\s-]?harm\w*/i,
  /\bhurt(?:ing)?\s+myself\b/i,
  /\bcut(?:ting)?\s+myself\b/i,
  /\bno\s+reason\s+to\s+(?:live|go\s+on)\b/i,
  /\boverdos\w+/i,
  /\bkill(?:ing)?\s+(?:him|her|them|someone|people)\b/i,
  /\bhurt(?:ing)?\s+(?:someone|somebody|people|him|her|them)\s+(?:badly|seriously)\b/i,
];

const classifierSchema = z.object({
  category: z
    .enum(["none", "distress", "crisis"])
    .describe(
      "crisis = active suicidal ideation, intent or plan of self-harm, intent to seriously harm others, or describing being in immediate danger. distress = significant pain but no indication of danger. none = ordinary difficult content."
    ),
  reason: z.string().describe("One short sentence."),
});

/**
 * Runs BEFORE any user message reaches the Guide agent.
 * Deterministic patterns first; the model classifier runs on EVERY
 * message — passive ideation rarely uses keyword-matchable phrasing.
 */
export async function checkSafety(message: string): Promise<SafetyVerdict> {
  for (const pattern of CRISIS_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return { level: "crisis", source: "keyword", trigger: match[0] };
    }
  }

  if (message.trim().length < 2) return { level: "none" };

  try {
    const { object } = await generateObject({
      model: MODELS.sentinel,
      schema: classifierSchema,
      system:
        "You are a safety triage classifier for a self-reflection app. Classify the user's message. Err on the side of crisis when in doubt about danger to self or others.",
      prompt: message,
    });
    if (object.category === "crisis") {
      return { level: "crisis", source: "classifier", trigger: object.reason };
    }
  } catch {
    // Classifier unavailable: the deterministic pass already ran, so the
    // message proceeds. Keyword coverage is the floor, not the ceiling.
  }

  return { level: "none" };
}

export { CRISIS_MESSAGE, CRISIS_RESOURCES } from "./resources";
