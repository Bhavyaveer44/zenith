import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const pipeline = [
  {
    step: "1 · Stories",
    title: "You tell real episodes",
    body: "Structured sessions walk you through one concrete moment from your life at a time — what happened, what you felt, what flashed through your mind. No vague venting; episodes are the raw data.",
  },
  {
    step: "2 · Patterns",
    title: "Zenith mines what repeats",
    body: "Every story is decomposed into observations — triggers, emotions, automatic thoughts, behaviors, outcomes. A pattern engine clusters them across all your stories and proposes hypotheses about what keeps happening.",
  },
  {
    step: "3 · Verification",
    title: "Nothing unproven reaches you",
    body: "An independent adversarial Verifier checks every hypothesis against your own quoted words. A pattern needs supporting evidence from at least three separate stories to be shown — or you never see it.",
  },
  {
    step: "4 · Blindspots",
    title: "Self-image vs. the record",
    body: "Quick check-ins capture how you think you operate. Zenith diffs that against what your stories show — and surfaces the gaps in both directions, including strengths you underrate.",
  },
  {
    step: "5 · Growth",
    title: "Experiments, not advice",
    body: "Confirmed patterns become small weekly experiments with a recorded prediction. Confidence isn't talked into you — it's built from your own evidence that the feared outcome keeps not happening.",
  },
];

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      <section className="relative mx-auto max-w-3xl space-y-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-24 -top-24 -bottom-12 -z-10 bg-[radial-gradient(ellipse_at_top,--alpha(var(--color-accent)/60%),transparent_65%)]"
        />
        <Badge variant="secondary">Structured · Evidence-gated · Yours</Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          See your patterns.
          <br />
          <span className="italic text-primary">With receipts.</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Zenith is a self-reflection tool that learns how you actually operate
          from the stories you tell — and never claims anything about you it
          can&apos;t back with your own words, from at least three separate
          episodes.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="lg" render={<Link href="/onboarding" />}>
            Get started
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/sessions" />}
          >
            Go to sessions
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pipeline.map((item) => (
            <Card
              key={item.step}
              className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader>
                <CardDescription className="text-primary">
                  {item.step}
                </CardDescription>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {item.body}
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed bg-secondary/40">
            <CardHeader>
              <CardDescription>Not a chatbot</CardDescription>
              <CardTitle className="text-base">
                Why this is different
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The usual AI &quot;therapist&quot; is one model improvising in a
              chat window. Zenith is a pipeline of six specialized agents —
              guide, safety sentinel, analyst, miner, verifier, coach — where
              the methodology lives in code and every insight must survive an
              adversarial evidence check before you see it.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-3xl rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
        <h3 className="mb-2 font-medium text-foreground">
          What Zenith is — and isn&apos;t
        </h3>
        <p>
          Zenith is a structured self-reflection and growth tool built on
          evidence-based methods (CBT thought records, narrative elicitation,
          behavioral experiments). It is <strong>not therapy</strong>, it does
          not diagnose, and it is not a substitute for a licensed professional
          — especially if you are struggling with your mental health. If you
          are in crisis, skip the app:{" "}
          <Link href="/crisis-resources" className="underline">
            talk to a real person now
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
