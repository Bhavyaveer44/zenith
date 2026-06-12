import { and, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeedbackButtons } from "@/components/feedback-buttons";
import { db } from "@/db";
import {
  blindspots,
  observations,
  patternEvidence,
  patterns,
  stories,
} from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface EvidenceQuote {
  quote: string;
  storyTitle: string;
}

export default async function MirrorPage() {
  if (!process.env.DATABASE_URL) {
    return (
      <p className="text-sm text-muted-foreground">
        Database not configured — see the README setup section.
      </p>
    );
  }
  const userId = await requireUserId();

  const visiblePatterns = await db
    .select()
    .from(patterns)
    .where(
      and(
        eq(patterns.userId, userId),
        inArray(patterns.status, ["verified", "confirmed"])
      )
    )
    .orderBy(desc(patterns.updatedAt));

  const evidenceByPattern = new Map<string, EvidenceQuote[]>();
  if (visiblePatterns.length > 0) {
    const evidence = await db
      .select({
        patternId: patternEvidence.patternId,
        quote: patternEvidence.quote,
        verdict: patternEvidence.verdict,
        storyTitle: stories.title,
      })
      .from(patternEvidence)
      .innerJoin(
        observations,
        eq(patternEvidence.observationId, observations.id)
      )
      .innerJoin(stories, eq(observations.storyId, stories.id))
      .where(
        inArray(
          patternEvidence.patternId,
          visiblePatterns.map((p) => p.id)
        )
      );
    for (const row of evidence) {
      if (row.verdict !== "supports") continue;
      const list = evidenceByPattern.get(row.patternId) ?? [];
      list.push({ quote: row.quote, storyTitle: row.storyTitle });
      evidenceByPattern.set(row.patternId, list);
    }
  }

  const visibleBlindspots = await db
    .select()
    .from(blindspots)
    .where(
      and(
        eq(blindspots.userId, userId),
        inArray(blindspots.status, ["proposed", "confirmed"])
      )
    )
    .orderBy(desc(blindspots.createdAt));

  const empty = visiblePatterns.length === 0 && visibleBlindspots.length === 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mirror</h1>
        <p className="text-muted-foreground">
          Everything here survived verification: at least three episodes, your
          own words, an adversarial evidence check. You stay the final judge.
        </p>
      </div>

      {empty ? (
        <div className="rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">
            Nothing verified yet — and that&apos;s by design.
          </p>
          <p>
            Zenith won&apos;t guess. Patterns need evidence from at least three
            separate stories. Tell a few episodes in{" "}
            <Link href="/sessions" className="underline">
              story sessions
            </Link>
            , then do a{" "}
            <Link href="/checkin" className="underline">
              check-in
            </Link>{" "}
            so blindspot scanning has something to compare against.
          </p>
        </div>
      ) : null}

      {visiblePatterns.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Your patterns</h2>
          {visiblePatterns.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">
                    {p.hypothesis}
                  </CardTitle>
                  <Badge
                    variant={p.status === "confirmed" ? "default" : "secondary"}
                  >
                    {p.status === "confirmed" ? "Confirmed by you" : "Verified"}
                  </Badge>
                </div>
                <CardDescription>{p.explanation}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    The receipts — your own words
                  </p>
                  <ul className="space-y-1.5">
                    {(evidenceByPattern.get(p.id) ?? []).map((e, i) => (
                      <li
                        key={i}
                        className="border-l-2 pl-3 text-sm text-muted-foreground"
                      >
                        “{e.quote}”{" "}
                        <span className="text-xs">— {e.storyTitle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {p.status === "verified" ? (
                  <FeedbackButtons
                    endpoint={`/api/patterns/${p.id}/feedback`}
                  />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {visibleBlindspots.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Blindspots</h2>
          {visibleBlindspots.map((b) => (
            <Card key={b.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug">
                    {b.summary}
                  </CardTitle>
                  <Badge
                    variant={b.status === "confirmed" ? "default" : "secondary"}
                  >
                    {b.status === "confirmed" ? "Confirmed by you" : "Proposed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-muted/60 p-3 text-sm">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      How you see it
                    </p>
                    {b.selfView}
                  </div>
                  <div className="rounded-md bg-muted/60 p-3 text-sm">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      What your stories show
                    </p>
                    {b.evidenceView}
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {(
                    b.evidence as {
                      quote: string;
                      storyTitle?: string;
                    }[]
                  ).map((e, i) => (
                    <li
                      key={i}
                      className="border-l-2 pl-3 text-sm text-muted-foreground"
                    >
                      “{e.quote}”
                      {e.storyTitle ? (
                        <span className="text-xs"> — {e.storyTitle}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {b.status === "proposed" ? (
                  <FeedbackButtons
                    endpoint={`/api/blindspots/${b.id}/feedback`}
                    confirmLabel="True — I didn't see it"
                    dismissLabel="Doesn't fit"
                  />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}
