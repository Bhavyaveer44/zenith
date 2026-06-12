import { groq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

// Model routing for the whole app lives in this file.
//
// - With GROQ_API_KEY set, all agents run on Groq (fast, generous free tier).
// - Otherwise they fall back to Claude via the Vercel AI Gateway, which
//   authenticates with the project's VERCEL_OIDC_TOKEN (`vercel env pull`).
// - Embeddings always go through the gateway: Groq doesn't offer an
//   embeddings API.
const useGroq = Boolean(process.env.GROQ_API_KEY);

function chatModel(groqId: string, gatewayId: string): LanguageModel {
  return useGroq ? groq(groqId) : gatewayId;
}

// Groq models must support structured outputs (json_schema) since every
// agent except the Guide uses generateObject — gpt-oss does, Llama doesn't.
export const MODELS = {
  /** Live session agent — conducts structured sessions (needs solid tool calling). */
  guide: chatModel("openai/gpt-oss-120b", "anthropic/claude-sonnet-4-6"),
  /** Safety classifier — fast, runs on every user message. */
  sentinel: chatModel("openai/gpt-oss-20b", "anthropic/claude-haiku-4-5"),
  /** Story Analyst — structured extraction of observations from stories. */
  analyst: chatModel("openai/gpt-oss-120b", "anthropic/claude-sonnet-4-6"),
  /** Pattern Miner — proposes pattern hypotheses from observation clusters. */
  miner: chatModel("openai/gpt-oss-120b", "anthropic/claude-sonnet-4-6"),
  /** Verifier — adversarial evidence check, kept separately swappable. */
  verifier: chatModel("openai/gpt-oss-120b", "anthropic/claude-sonnet-4-6"),
  /** Growth Coach — designs behavioral experiments. */
  coach: chatModel("openai/gpt-oss-120b", "anthropic/claude-sonnet-4-6"),
  /** Embeddings for observations and clustering (always gateway). */
  embedding: "openai/text-embedding-3-small",
} as const;

export const EMBEDDING_DIMENSIONS = 1536;

export function hasAiKey() {
  return Boolean(
    process.env.GROQ_API_KEY ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN
  );
}
