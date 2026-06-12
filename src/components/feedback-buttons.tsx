"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function FeedbackButtons({
  endpoint,
  confirmLabel = "Yes, that's me",
  dismissLabel = "That's not me",
}: {
  endpoint: string;
  confirmLabel?: string;
  dismissLabel?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function send(action: "confirm" | "dismiss") {
    setPending(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        action === "confirm"
          ? "Confirmed — Zenith will build on this."
          : "Dismissed — Zenith won't show this again."
      );
      router.refresh();
    } catch {
      toast.error("Couldn't save your feedback.");
      setPending(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => send("confirm")}
      >
        {confirmLabel}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => send("dismiss")}
      >
        {dismissLabel}
      </Button>
    </div>
  );
}
