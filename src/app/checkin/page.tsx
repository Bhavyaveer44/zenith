"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CHECKIN_AREAS } from "@/lib/checkin-areas";
import { cn } from "@/lib/utils";

export default function CheckinPage() {
  const router = useRouter();
  const [areaId, setAreaId] = useState<string>(CHECKIN_AREAS[0].id);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const area = CHECKIN_AREAS.find((a) => a.id === areaId)!;

  async function submit() {
    if (rating === null) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: area.id,
          question: area.question,
          selfRating: rating,
          answer: note || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        "Saved. Zenith is comparing this with your stories — any blindspot it can prove shows up on the Mirror."
      );
      router.push("/mirror");
    } catch {
      toast.error("Couldn't save the check-in.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check-in</h1>
        <p className="text-muted-foreground">
          Rate yourself honestly — the point isn&apos;t the score, it&apos;s
          the comparison against what your stories actually show.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pick an area</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {CHECKIN_AREAS.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setAreaId(a.id);
                  setRating(null);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  a.id === areaId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">{area.question}</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={cn(
                    "h-9 w-9 rounded-md border text-sm transition-colors",
                    rating === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              1 = not at all · 10 = extremely
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Anything to add? (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. 'I used to be worse at this' or 'depends on who it is'"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={rating === null || submitting}
            onClick={submit}
          >
            {submitting ? "Saving…" : "Submit check-in"}
          </Button>
        </CardFooter>
      </Card>

      <CardDescription>
        Blindspots only appear when Zenith can prove the gap with at least
        three quotes from your own stories — so check-ins get more useful the
        more episodes you&apos;ve told.
      </CardDescription>
    </div>
  );
}
