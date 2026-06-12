// Seeds 6 stories for the local user with a deliberate recurring pattern
// (conflict avoidance / over-accommodation) plus decoy variety, so the
// pipeline can be verified end-to-end:
//
//   npm run seed
//   then POST /api/dev/backfill (`curl -X POST localhost:3000/api/dev/backfill`)
//
// Expected: the miner+verifier surface a conflict-avoidance pattern with
// quoted evidence; weak one-off themes do NOT appear.

async function main() {
  const { db } = await import("../src/db");
  const { profiles, stories } = await import("../src/db/schema");

  const userId = "local-user";

  await db
    .insert(profiles)
    .values({ userId, displayName: "Seed User", consentAt: new Date() })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { consentAt: new Date() },
    });

  const seedStories = [
    {
      title: "Extra deadline from my manager",
      narrative:
        "On Tuesday my manager asked me to take on the quarterly report on top of my sprint work. I was already behind and exhausted. I heard myself say 'sure, no problem' before I even thought about it. The thought in my head was 'if I say no she'll think I'm not committed'. I stayed up until 1am twice that week. By Friday I was resentful and snapped at my teammate over nothing. I never told my manager it was too much.",
    },
    {
      title: "Friend's birthday trip",
      narrative:
        "My friend planned a weekend trip for her birthday and assumed I'd drive everyone, four hours each way. I had wanted that weekend to rest. When she asked, I felt my chest tighten, and I thought 'if I push back, I'll ruin her birthday and she'll be hurt'. So I said 'of course!'. I drove, I smiled, and on the drive back I was quietly furious at everyone and at myself. I vented to my sister afterward instead of ever saying anything to my friend.",
    },
    {
      title: "Restaurant order mix-up",
      narrative:
        "We ordered food and they brought me the wrong dish, something I actively dislike. The waiter asked if everything was fine and I said 'yes, all good, thanks'. The thought was 'it's not worth the awkwardness, don't make a scene'. I ate half of it and felt annoyed for the rest of the dinner. My partner asked why I was quiet and I said I was just tired.",
    },
    {
      title: "Roommate and the dishes",
      narrative:
        "My roommate left dishes piled up for the fourth day in a row. I rehearsed bringing it up while standing in the kitchen, and the thought that stopped me was 'he'll think I'm petty and things will get tense in the apartment'. So instead I just washed all of them myself, loudly, hoping he'd notice. He didn't. I was irritated all evening and ended up sending a passive 'all good?' text I regretted.",
    },
    {
      title: "Presentation that went fine",
      narrative:
        "I gave a presentation to the leadership team. The night before I barely slept, convinced I'd freeze. The thought looping was 'they'll see I don't know what I'm talking about'. During the actual presentation I answered every question, and the VP said it was the clearest overview she'd seen of the project. Afterwards I felt relieved but mostly I just noticed all the small stumbles I'd made.",
    },
    {
      title: "Cousin asked to borrow money again",
      narrative:
        "My cousin asked to borrow money for the third time this year; he still hasn't paid back the first loan. I felt a flash of anger, and then the familiar thought, 'if I refuse, I'm the bad guy in the family'. I said yes and transferred it the same evening. I didn't mention the earlier loans. Then I spent the week irritated, complaining about it to my partner but never to him.",
    },
  ];

  await db.insert(stories).values(
    seedStories.map((s) => ({
      userId,
      title: s.title,
      narrative: s.narrative,
    }))
  );

  console.log(
    `Seeded ${seedStories.length} stories for '${userId}'. Now run the pipeline:\n  curl -X POST http://localhost:3000/api/dev/backfill`
  );
}

main().then(() => process.exit(0));
