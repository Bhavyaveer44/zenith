import type { Protocol } from "./types";

// Behavioral-experiment review session, drawn from behavioral activation
// and the experimental method in CBT: prediction vs. outcome is where
// confidence is actually built.
export const weeklyReview: Protocol = {
  id: "weekly-review",
  name: "Weekly Review",
  tagline: "Review your experiments: what you predicted vs. what actually happened.",
  evidenceBase: "Behavioral experiments (CBT) · Behavioral activation",
  opening:
    "Welcome to your weekly review. This session is about your experiments — the small real-world tests you've been running. We'll compare what you predicted would happen with what actually happened, because that gap is where confidence gets built.\n\nFirst, how did this week go overall — in a sentence or two?",
  steps: [
    {
      id: "checkin",
      title: "Check in",
      goal: "The user has given a brief read on their week.",
      guidance: "Brief and warm. One question. Don't open new territory yet.",
    },
    {
      id: "review-experiments",
      title: "Review experiments",
      goal: "Each active experiment listed in the session context has been reviewed: did they do it, what actually happened, and did the prediction come true?",
      guidance:
        "Go through the active experiments one at a time (they are listed in your context). For each: did it happen? What actually happened, concretely? Compare with their recorded prediction — read the prediction back verbatim. If they didn't do it, get curious about what got in the way without judgment; that obstacle is data too.",
    },
    {
      id: "extract",
      title: "What it means",
      goal: "For each completed experiment, the user has said what the prediction-vs-outcome gap (or match) tells them.",
      guidance:
        "When a feared prediction didn't come true, let THEM say it — ask 'so what does that tell you?' rather than announcing the lesson. When a prediction did come true, treat it seriously and explore what they'd adjust. Tie observations back to their recorded patterns only if the patterns are listed in your context as verified.",
    },
    {
      id: "close",
      title: "Close",
      goal: "The review is saved via save_story and the session ended via end_session.",
      guidance:
        "Call save_story with title 'Weekly review' and a narrative summarizing in the user's words: each experiment, prediction, actual outcome, and what they said it means. Reflect one genuine piece of progress from their own data. Then call end_session.",
    },
  ],
};
