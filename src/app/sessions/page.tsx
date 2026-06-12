import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StartSessionButton } from "@/components/start-session-button";
import { db } from "@/db";
import { profiles, sessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { getProtocol, protocolList } from "@/lib/protocols";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  active: "In progress",
  completed: "Completed",
  paused_crisis: "Paused",
};

export default async function SessionsPage() {
  if (!process.env.DATABASE_URL) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Database not configured</p>
        <p>
          Set <code>DATABASE_URL</code> in <code>.env.local</code> (Neon
          Postgres) and run <code>npm run db:push</code>. See the README for
          the full setup.
        </p>
      </div>
    );
  }

  const userId = await requireUserId();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (!profile?.consentAt) redirect("/onboarding");

  const recent = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt))
    .limit(20);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">
            Every session is structured — pick the protocol that fits today.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {protocolList.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription>{p.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-xs text-muted-foreground">
                <Badge variant="outline">{p.evidenceBase}</Badge>
                <p className="mt-3">
                  {p.steps.length} steps:{" "}
                  {p.steps.map((s) => s.title).join(" → ")}
                </p>
              </CardContent>
              <CardFooter>
                <StartSessionButton protocolId={p.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent sessions</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sessions yet. Your first story session is the best place to
            start — Zenith needs episodes before it can find patterns.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((s) => {
              const protocol = getProtocol(s.protocolId);
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <span className="font-medium">
                      {protocol?.name ?? s.protocolId}
                    </span>
                    {s.summary ? (
                      <p className="truncate text-muted-foreground">
                        {s.summary}
                      </p>
                    ) : null}
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <Badge
                      variant={s.status === "active" ? "default" : "secondary"}
                    >
                      {statusLabel[s.status] ?? s.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {s.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
