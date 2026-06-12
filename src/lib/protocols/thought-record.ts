import type { Protocol } from "./types";

// Classic CBT 7-column thought record, run as a guided conversation.
export const thoughtRecord: Protocol = {
  id: "thought-record",
  name: "Thought Record",
  tagline: "Take one painful thought through the classic CBT evidence test.",
  evidenceBase: "Cognitive Behavioral Therapy (Beck/Greenberger & Padesky)",
  opening:
    "This is a thought record — the classic CBT exercise for examining one painful thought against the evidence, step by step.\n\nLet's start with the situation: what was the specific moment when the difficult feeling showed up? Where were you, and what was happening?",
  steps: [
    {
      id: "situation",
      title: "Situation",
      goal: "A specific situation is pinned down: when, where, who, what was happening. Facts only.",
      guidance:
        "Keep it to observable facts, one specific moment. If the user gives a feeling or thought instead, note it for later and steer back to the situation.",
    },
    {
      id: "emotions",
      title: "Emotions",
      goal: "Emotions in that moment are named and each rated 0–100 in intensity.",
      guidance:
        "Emotions are one word each (sad, ashamed, anxious...). If they give a thought ('I felt like a failure'), label it as a thought to revisit and ask what emotion came with it. Get a 0–100 rating for each.",
    },
    {
      id: "automatic-thought",
      title: "The thought",
      goal: "The hot automatic thought is captured verbatim, and the user has rated how much they believe it (0–100).",
      guidance:
        "Find the HOT thought — the one carrying the most charge, usually the one tied to the strongest emotion. Capture it in their exact words. Ask for belief rating 0–100.",
    },
    {
      id: "evidence-for",
      title: "Evidence for",
      goal: "The user has listed factual evidence that supports the hot thought.",
      guidance:
        "Facts only — things a camera would record. Feelings and interpretations don't count as evidence ('I felt awkward' is not evidence that 'everyone thinks I'm incompetent'). Be fair: genuinely look for real supporting evidence.",
    },
    {
      id: "evidence-against",
      title: "Evidence against",
      goal: "The user has listed factual evidence that doesn't fit the hot thought.",
      guidance:
        "Useful prompts: 'Is there anything that doesn't fit?', 'What would you point out if a friend had this thought?', 'Any exceptions, even small ones?'. Do not supply the evidence yourself — draw it out.",
    },
    {
      id: "balanced-thought",
      title: "Balanced thought",
      goal: "The user has composed a balanced thought that accounts for BOTH evidence columns, and rated belief in it.",
      guidance:
        "The balanced thought must be theirs, in their words, and must honor the evidence for — it's not positive thinking, it's accurate thinking. Help them refine it until it feels true, not just nice.",
    },
    {
      id: "re-rate",
      title: "Re-rate & close",
      goal: "Original emotions re-rated, the record saved via save_story, session ended via end_session.",
      guidance:
        "Re-rate the original emotions 0–100. Call save_story with a title like 'Thought record: <situation>' and a narrative that captures the full record (situation, emotions with ratings before/after, hot thought verbatim, both evidence lists, balanced thought) in the user's words. Reflect the shift (or honestly note if there wasn't one). Then call end_session.",
    },
  ],
};
