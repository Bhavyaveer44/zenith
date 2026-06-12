"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StartSessionButton({ protocolId }: { protocolId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocolId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/sessions/${id}`);
    } catch {
      toast.error("Couldn't start the session. Is the database configured?");
      setLoading(false);
    }
  }

  return (
    <Button onClick={start} disabled={loading} className="w-full">
      {loading ? "Starting…" : "Start"}
    </Button>
  );
}
