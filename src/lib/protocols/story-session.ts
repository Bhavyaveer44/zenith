import type { Protocol } from "./types";

// Narrative-elicitation session. Draws on narrative therapy and the
// CBT case-formulation interview: concrete episode first, facts before
// interpretation, emotions and automatic thoughts anchored to moments
// in the story, meaning-making last.
export const storySession: Protocol = {
  id: "story-session",
  name: "Story Session",
  tagline: "Tell one real episode from your life. Zenith learns from what actually happened.",
  evidenceBase: "Narrative therapy · CBT case formulation",
  opening:
    "Welcome. This is a story session — we'll spend it on one real, recent episode from your life, told the way it actually happened. Stories are how Zenith learns your patterns: not from opinions about yourself, but from what you actually did, felt, and thought in real moments.\n\nTo start: how are you arriving right now, in a word or two? And is there anything from the last week or two that's been sitting with you?",
  steps: [
    {
      id: "arrive",
      title: "Arrive",
      goal: "The user has named how they're arriving and a rough territory for today (a feeling, a relationship, a recurring situation).",
      guidance:
        "Be warm and brief. One question at a time. Do not analyze anything yet. If they immediately launch into a story, follow them and advance.",
    },
    {
      id: "choose-episode",
      title: "Choose an episode",
      goal: "A single, concrete, specific episode is chosen — a particular moment with a time and place, not a generalization ('last Tuesday in the kitchen', not 'my mom always...').",
      guidance:
        "If the user speaks in generalities ('I always mess up presentations'), ask for the most recent specific time it happened. Concreteness is non-negotiable: patterns are mined from episodes, not summaries. Help them pick ONE episode if they offer several.",
    },
    {
      id: "narrate",
      title: "Walk through it",
      goal: "The episode has a beginning, middle, and end told in the user's own words: what happened, who said and did what, in sequence. Facts first.",
      guidance:
        "Ask short sequencing questions: 'What happened right before?', 'What did you say then?', 'And then?'. Keep them in the scene. Gently defer interpretation ('we'll get to what it means — first, what happened next?'). Do NOT supply interpretations yourself.",
    },
    {
      id: "inner-track",
      title: "The inner track",
      goal: "For the 1–3 key moments in the story, the user has named: the emotion (and intensity), where they felt it in the body if accessible, and the automatic thought that flashed by.",
      guidance:
        "Anchor every question to a specific moment from THEIR story ('right when she said X — what went through your mind?'). Use their exact words back to them. Automatic thoughts should be captured verbatim where possible — they are the raw material for pattern mining.",
    },
    {
      id: "meaning",
      title: "Meaning",
      goal: "The user has articulated what this episode seems to say about them, others, or the world — and has been asked one good question that gently tests that belief.",
      guidance:
        "Ask 'what does this say about you, if anything?'. Then ask at most ONE Socratic question testing the belief (an exception, an alternative reading). Do not lecture, do not deliver insights about their patterns — you have not verified any. Curiosity, not conclusions.",
    },
    {
      id: "close",
      title: "Close",
      goal: "The story is saved via the save_story tool, the user has named one takeaway, and the session is ended via the end_session tool.",
      guidance:
        "First call save_story with a short title and the episode narrative assembled faithfully from the user's own telling (their words, first person, including the key emotions and automatic thoughts they named). Then reflect back a 2–3 sentence summary, ask for their one takeaway, thank them, and call end_session.",
    },
  ],
};
