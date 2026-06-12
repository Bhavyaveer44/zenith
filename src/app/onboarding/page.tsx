"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const terms = [
  "Zenith is a structured self-reflection and growth tool. It is not therapy, counseling, or medical care, and it does not diagnose or treat anything.",
  "Zenith learns from the stories you tell. They are analyzed by AI models to find recurring patterns, and stored in your private account.",
  "Insights are evidence-gated, but they can still be wrong. You are the final judge of what's true about you — every insight can be dismissed.",
  "If you are in crisis, Zenith will stop and point you to real humans. It will not attempt to help in an emergency, because an app shouldn't.",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/sessions");
    } catch {
      toast.error(
        "Couldn't save. Is the database configured? (See README → setup.)"
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Before you start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ul className="space-y-3 text-sm text-muted-foreground">
            {terms.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-foreground">·</span>
                {t}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Label htmlFor="name">What should Zenith call you? (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I understand what Zenith is and isn&apos;t, and I agree to the
            above.
          </label>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={!agreed || submitting}
            onClick={submit}
          >
            {submitting ? "Saving…" : "Start my first session"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
