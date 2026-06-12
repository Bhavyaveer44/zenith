// Run only the pattern miner with concise error output:
//   npx tsx --env-file=.env.local scripts/mine-once.ts

async function main() {
  const { minePatterns } = await import("../src/lib/analysis/miner");
  try {
    await minePatterns("local-user");
    console.log("MINING OK");
  } catch (e) {
    const err = e as Error & { cause?: Error; text?: string };
    console.error("NAME:", err.name);
    console.error("MSG:", (err.message ?? "").slice(0, 600));
    if (err.cause) {
      console.error(
        "CAUSE:",
        String((err.cause as Error).message ?? err.cause).slice(0, 600)
      );
    }
    if (err.text) console.error("TEXT:", String(err.text).slice(0, 400));
  }
}

main().then(() => process.exit(0));
