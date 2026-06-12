"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CrisisCard } from "@/components/crisis-card";
import { cn } from "@/lib/utils";

interface SessionMeta {
  id: string;
  status: string;
  summary: string | null;
  messages: UIMessage[];
  protocol: {
    id: string;
    name: string;
    evidenceBase: string;
    steps: { id: string; title: string }[];
  };
  currentStepId: string;
  currentStepIndex: number;
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1", isUser && "items-end")}>
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          if (!part.text.trim()) return null;
          return (
            <div
              key={i}
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-7",
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card shadow-xs"
              )}
            >
              {part.text}
            </div>
          );
        }
        if (part.type === "tool-advance_step" && part.state === "output-available") {
          const output = part.output as { nowOnStep?: string } | undefined;
          if (!output?.nowOnStep) return null;
          return (
            <Badge key={i} variant="outline" className="text-xs">
              → {output.nowOnStep}
            </Badge>
          );
        }
        if (part.type === "tool-save_story" && part.state === "output-available") {
          return (
            <Badge key={i} variant="outline" className="text-xs">
              ✓ Story saved — Zenith will learn from it
            </Badge>
          );
        }
        return null;
      })}
    </div>
  );
}

export function SessionView({ sessionId }: { sessionId: string }) {
  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [input, setInput] = useState("");
  const [loadError, setLoadError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshMeta = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) {
      setLoadError(true);
      return null;
    }
    const data: SessionMeta = await res.json();
    setMeta(data);
    return data;
  }, [sessionId]);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: sessionId,
    transport: new DefaultChatTransport({
      api: `/api/sessions/${sessionId}/messages`,
    }),
    onFinish: () => {
      refreshMeta();
    },
  });

  useEffect(() => {
    refreshMeta().then((data) => {
      if (data) setMessages(data.messages);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const crisis =
    meta?.status === "paused_crisis" ||
    messages.some((m) => m.parts.some((p) => p.type === "data-crisis"));
  const completed = meta?.status === "completed";
  const busy = status === "submitted" || status === "streaming";

  function submit() {
    const text = input.trim();
    if (!text || busy || crisis || completed) return;
    setInput("");
    sendMessage({ text });
  }

  if (loadError) {
    return (
      <p className="text-sm text-muted-foreground">
        Session not found.{" "}
        <Link href="/sessions" className="underline">
          Back to sessions
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[200px_1fr]">
      {/* Protocol progress rail */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        {meta ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">{meta.protocol.name}</p>
              <p className="text-xs text-muted-foreground">
                {meta.protocol.evidenceBase}
              </p>
            </div>
            <ol className="flex flex-row flex-wrap gap-2 text-xs lg:flex-col lg:gap-2.5">
              {meta.protocol.steps.map((step, i) => {
                const state =
                  completed || i < meta.currentStepIndex
                    ? "done"
                    : i === meta.currentStepIndex
                      ? "current"
                      : "todo";
                return (
                  <li key={step.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                        state === "done" &&
                          "border-primary bg-primary text-primary-foreground",
                        state === "current" && "border-primary text-primary",
                        state === "todo" && "text-muted-foreground"
                      )}
                    >
                      {state === "done" ? "✓" : i + 1}
                    </span>
                    <span
                      className={cn(
                        state === "current"
                          ? "font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Loading…</p>
        )}
      </aside>

      {/* Conversation */}
      <div className="flex min-h-[60vh] flex-col gap-4">
        <div className="flex-1 space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {status === "submitted" ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : null}
          {crisis ? <CrisisCard /> : null}
          {completed ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Session complete.</p>
              {meta?.summary ? (
                <p className="mt-1 text-muted-foreground">{meta.summary}</p>
              ) : null}
              <p className="mt-2 text-muted-foreground">
                Zenith is analyzing this story in the background. Patterns show
                up on the{" "}
                <Link href="/mirror" className="underline">
                  Mirror
                </Link>{" "}
                once they survive verification.
              </p>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {!crisis && !completed ? (
          <div className="sticky bottom-4 flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Type your reply… (Enter to send, Shift+Enter for a new line)"
              className="min-h-[44px] max-h-40 resize-none border-0 shadow-none focus-visible:ring-0"
              disabled={busy}
            />
            <Button onClick={submit} disabled={busy || !input.trim()}>
              Send
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
