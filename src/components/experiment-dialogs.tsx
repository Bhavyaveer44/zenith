"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProposeExperimentButton({
  patternId,
  patternHypothesis,
}: {
  patternId: string;
  patternHypothesis: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [action, setAction] = useState("");
  const [prediction, setPrediction] = useState("");

  async function propose() {
    setLoading(true);
    try {
      const res = await fetch("/api/experiments/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternId }),
      });
      if (!res.ok) throw new Error();
      const draft = await res.json();
      setTitle(draft.title);
      setAction(draft.action);
      setPrediction(draft.prediction);
      setOpen(true);
    } catch {
      toast.error("Couldn't draft an experiment. Is the AI key configured?");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternId, title, action, prediction }),
      });
      if (!res.ok) throw new Error();
      toast.success("Experiment started. Review it in your next Weekly Review session.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't save the experiment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={propose} disabled={loading}>
        {loading ? "Drafting…" : "Design an experiment"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your experiment — edit anything</DialogTitle>
            <DialogDescription>
              Testing: “{patternHypothesis}”. The coach drafted this; it only
              counts if it&apos;s yours, so change whatever doesn&apos;t fit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>The action (small, this week)</Label>
              <Textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Your prediction (what you expect/fear will happen)</Label>
              <Textarea
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving || !title || !action || !prediction}>
              {saving ? "Saving…" : "Start experiment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CompleteExperimentButton({
  experimentId,
  prediction,
}: {
  experimentId: string;
  prediction: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [reflection, setReflection] = useState("");
  const [cameTrue, setCameTrue] = useState<boolean | null>(null);

  async function save() {
    if (cameTrue === null) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/experiments/${experimentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          outcome,
          reflection: reflection || undefined,
          predictionCameTrue: cameTrue,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Logged. That's one more real data point about you.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't save the result.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Log result
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What actually happened?</DialogTitle>
            <DialogDescription>
              Your recorded prediction was: “{prediction}”
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>The outcome, concretely</Label>
              <Textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What actually happened when you did it?"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Did your prediction come true?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={cameTrue === false ? "default" : "outline"}
                  onClick={() => setCameTrue(false)}
                >
                  No, it didn&apos;t
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={cameTrue === true ? "default" : "outline"}
                  onClick={() => setCameTrue(true)}
                >
                  Yes, it did
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>What do you take from that? (optional)</Label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={save}
              disabled={saving || !outcome || cameTrue === null}
            >
              {saving ? "Saving…" : "Save result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
