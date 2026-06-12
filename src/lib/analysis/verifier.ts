import { generateObject } from "ai";
import { z } from "zod";
import { MODELS } from "@/lib/ai";

export interface EvidenceItem {
  observationId: string;
  kind: string;
  content: string;
  quote: string;
  storyId: string;
  storyTitle: string;
}

export interface VerifierResult {
  overall: "pass" | "fail";
  confidence: number;
  notes: string;
  verdicts: { observationId: string; verdict: "supports" | "weak" | "rejected" }[];
}

const verifierSchema = z.object({
  verdicts: z.array(
    z.object({
      observationId: z.string(),
      verdict: z.enum(["supports", "weak", "rejected"]),
      reason: z.string(),
    })
  ),
  overall: z.enum(["pass", "fail"]),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("How strongly the surviving evidence supports the claim."),
  notes: z.string().describe("One or two sentences for the audit log."),
});

/**
 * The Verifier is the gate between hypotheses and the user. It runs as a
 * separate model call with adversarial instructions: its job is to find
 * reasons the claim is NOT supported. Nothing reaches the UI without a pass.
 */
export async function verifyClaim(
  claim: string,
  explanation: string,
  evidence: EvidenceItem[]
): Promise<VerifierResult> {
  const { object } = await generateObject({
    model: MODELS.verifier,
    schema: verifierSchema,
    system: `You are the Verifier for Zenith. Your job is ADVERSARIAL: assume the claim about the user is wrong and try to knock it down.

For each evidence item, judge whether the quote genuinely supports the claim:
- "supports": the quote, on its own, is real evidence for the claim.
- "weak": related but ambiguous, or requires interpretation the quote doesn't license.
- "rejected": does not support the claim, or the quote contradicts it.

Then judge "overall":
- "pass" ONLY if at least 3 items are "supports" AND they come from at least 3 different stories AND the claim is stated as an observed pattern (not a diagnosis, not a cause, not a character judgment).
- Otherwise "fail".

Automatic fail conditions: the claim diagnoses a disorder, asserts a childhood/root cause, makes a global character judgment ("you are insecure"), or overreaches beyond what repeated episodes can show.`,
    prompt: `Claim about the user: ${claim}

Proposed explanation: ${explanation}

Evidence items:
${evidence
  .map(
    (e) =>
      `- observationId: ${e.observationId}\n  story: "${e.storyTitle}" (${e.storyId})\n  ${e.kind}: ${e.content}\n  quote: "${e.quote}"`
  )
  .join("\n")}`,
  });

  // Enforce the 3-supports / 3-stories rule in code as well — the
  // Verifier's instructions are not the only line of defense.
  const supportIds = new Set(
    object.verdicts.filter((v) => v.verdict === "supports").map((v) => v.observationId)
  );
  const supportingStories = new Set(
    evidence.filter((e) => supportIds.has(e.observationId)).map((e) => e.storyId)
  );
  const meetsBar = supportIds.size >= 3 && supportingStories.size >= 3;

  return {
    overall: object.overall === "pass" && meetsBar ? "pass" : "fail",
    confidence: object.confidence,
    notes: object.notes,
    verdicts: object.verdicts.map((v) => ({
      observationId: v.observationId,
      verdict: v.verdict,
    })),
  };
}
