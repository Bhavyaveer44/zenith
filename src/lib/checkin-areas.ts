// Structured self-assessment areas. Each answer is later diffed against
// the user's narrative evidence by the blindspot scanner.
export const CHECKIN_AREAS = [
  {
    id: "boundaries",
    label: "Boundaries",
    question: "How good are you at saying no to things you don't want to do?",
  },
  {
    id: "conflict",
    label: "Conflict",
    question: "How directly do you address it when someone upsets you?",
  },
  {
    id: "self-criticism",
    label: "Self-criticism",
    question: "How fairly do you treat yourself after a mistake?",
  },
  {
    id: "asking-for-help",
    label: "Asking for help",
    question: "How readily do you ask for help when you're struggling?",
  },
  {
    id: "risk",
    label: "Trying things",
    question: "How willing are you to attempt things you might fail at?",
  },
  {
    id: "self-confidence",
    label: "Confidence",
    question: "How much do you trust your own judgment under pressure?",
  },
] as const;
