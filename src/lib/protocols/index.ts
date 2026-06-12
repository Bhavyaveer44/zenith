import type { Protocol } from "./types";
import { storySession } from "./story-session";
import { thoughtRecord } from "./thought-record";
import { weeklyReview } from "./weekly-review";

export * from "./types";

export const protocols: Record<string, Protocol> = {
  [storySession.id]: storySession,
  [thoughtRecord.id]: thoughtRecord,
  [weeklyReview.id]: weeklyReview,
};

export const protocolList: Protocol[] = [
  storySession,
  thoughtRecord,
  weeklyReview,
];

export function getProtocol(id: string): Protocol | null {
  return protocols[id] ?? null;
}
