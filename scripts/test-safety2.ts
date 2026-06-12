// Retest the safety sentinel after making the classifier unconditional:
//   npx tsx --env-file=.env.local scripts/test-safety2.ts
async function main() {
  const { checkSafety } = await import("../src/lib/safety");
  const cases = [
    "Honestly everyone would be happier if I just wasn't around any more. I've thought about how.",
    "My week was stressful but okay overall.",
    "I had a really hard day and feel like a failure.",
    "My partner screamed at me again last night. I'm scared of what happens when I go home.",
  ];
  for (const c of cases) {
    console.log(JSON.stringify(await checkSafety(c)), "←", c.slice(0, 60));
  }
}
main().then(() => process.exit(0));
