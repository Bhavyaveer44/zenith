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
import {
  CompleteExperimentButton,
  ProposeExperimentButton,
} from "@/components/experiment-dialogs";
import { db } from "@/db";
import { experiments, patterns, stories } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GrowthPage() {
  if (!process.env.DATABASE_URL) {
    return (
      <p className="text-sm text-muted-foreground">
        Database not configured — see the README setup section.
      </p>
    );
  }
  const userId = await requireUserId();

  const [allExperiments, confirmable, storyCount] = await Promise.all([
    db
      .select()
      .from(experiments)
      .where(eq(experiments.userId, userId))
      .orderBy(desc(experiments.createdAt)),
    db
      .select()
      .from(patterns)
      .where(
        and(
          eq(patterns.userId, userId),
          inArray(patterns.status, ["confirmed", "verified"])
        )
      ),
    db
      .select({ id: stories.id })
      .from(stories)
      .where(eq(stories.userId, userId)),
  ]);

  const active = allExperiments.filter((e) => e.status === "active");
  const completed = allExperiments.filter((e) => e.status === "completed");
  const fearsDisproven = completed.filter(
    (e) => e.predictionCameTrue === false
  ).length;

  const stats = [
    { label: "Stories told", value: storyCount.length },
    { label: "Patterns surfaced", value: confirmable.length },
    { label: "Experiments completed", value: completed.length },
    { label: "Predictions that didn't come true", value: fearsDisproven },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Growth</h1>
        <p className="text-muted-foreground">
          Small real-world experiments against your own predictions. The last
          number is where confidence comes from.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-3xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Active experiments</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active experiments.{" "}
            {confirmable.length > 0
              ? "Design one from a pattern below."
              : "Patterns from your stories will appear below once verified — experiments are designed from them."}
          </p>
        ) : (
          active.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{e.title}</CardTitle>
                  <CompleteExperimentButton
                    experimentId={e.id}
                    prediction={e.prediction}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Action:</span> {e.action}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Your prediction:
                  </span>{" "}
                  “{e.prediction}”
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {confirmable.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Design from a pattern</h2>
          <div className="space-y-3">
            {confirmable.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm">{p.hypothesis}</p>
                <div className="shrink-0">
                  <ProposeExperimentButton
                    patternId={p.id}
                    patternHypothesis={p.hypothesis}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {completed.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">The record</h2>
          <div className="space-y-3">
            {completed.map((e) => (
              <Card key={e.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{e.title}</CardTitle>
                    <Badge
                      variant={
                        e.predictionCameTrue === false
                          ? "default"
                          : "secondary"
                      }
                    >
                      {e.predictionCameTrue === false
                        ? "Prediction disproven"
                        : "Prediction held"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Predicted: “{e.prediction}”
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">What happened:</span>{" "}
                    {e.outcome}
                  </p>
                  {e.reflection ? (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Takeaway:
                      </span>{" "}
                      {e.reflection}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Review active experiments in a{" "}
        <Link href="/sessions" className="underline">
          Weekly Review session
        </Link>{" "}
        — the Guide reads your predictions back to you, verbatim.
      </p>
    </div>
  );
}
