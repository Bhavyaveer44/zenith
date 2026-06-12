import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db, assertDb } from "@/db";
import { experiments, safetyEvents, sessions, stories } from "@/db/schema";
import { MODELS } from "@/lib/ai";
import { analyzeStory } from "@/lib/analysis/analyst";
import { requireUserId } from "@/lib/auth";
import { getProtocol, getStep, nextStep, type Protocol } from "@/lib/protocols";
import { checkSafety, CRISIS_MESSAGE } from "@/lib/safety";

export const maxDuration = 300;

function lastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return "";
  return last.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

function buildSystemPrompt(
  protocol: Protocol,
  currentStepId: string,
  context: string
): string {
  const step = getStep(protocol, currentStepId);
  const stepList = protocol.steps
    .map((s, i) => `${i + 1}. ${s.title} (${s.id})`)
    .join("\n");

  return `You are the Guide for Zenith, a structured self-reflection and growth tool. You conduct sessions that follow a fixed, evidence-based protocol. The methodology is decided by the protocol — your job is to phrase good questions and listen well within it.

CURRENT PROTOCOL: ${protocol.name} (${protocol.evidenceBase})
Steps:
${stepList}

YOU ARE ON STEP: "${step.title}" (${step.id})
Step goal: ${step.goal}
Step technique constraints: ${step.guidance}

HOW TO WORK:
- Ask ONE question at a time. Keep responses short — usually 2 to 5 sentences.
- Use the user's exact words back to them. Never put words in their mouth.
- When (and only when) the current step's goal is met, call advance_step with a one-line summary of what was established, then continue seamlessly with the new step's first question. The tool result gives you the next step's goal and constraints.
- Warm, plain, direct. No therapy-speak, no lectures, no bullet-point advice dumps.

HARD BOUNDARIES (non-negotiable):
- You are NOT a therapist and Zenith is not therapy. Never diagnose, never name disorders, never give medical or medication advice.
- Never make claims about the user's "patterns" — patterns are mined and verified elsewhere from accumulated evidence; a single session cannot establish one.
- Never speculate about root causes or childhood origins.
- If the user asks for advice, prefer a question that helps them reason it out; if you do offer a perspective, ground it in something THEY said and frame it as theirs to evaluate.
- If the user mentions wanting to harm themselves or others, or being in danger, do not handle it in conversation — that is intercepted before you, but if anything slips through, respond only by encouraging them to contact a crisis line or emergency services.
${context ? `\nSESSION CONTEXT:\n${context}` : ""}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  assertDb();
  const userId = await requireUserId();
  const { id: sessionId } = await params;
  const { messages }: { messages: UIMessage[] } = await req.json();

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
  if (!session) return new Response("Not found", { status: 404 });
  if (session.status !== "active") {
    return new Response("Session is not active", { status: 409 });
  }
  const protocol = getProtocol(session.protocolId);
  if (!protocol) return new Response("Unknown protocol", { status: 500 });

  // ---- Safety Sentinel: runs before the Guide ever sees the message ----
  const userText = lastUserText(messages);
  const verdict = await checkSafety(userText);
  if (verdict.level === "crisis") {
    await db.insert(safetyEvents).values({
      userId,
      sessionId,
      source: verdict.source,
      trigger: verdict.trigger,
    });
    await db
      .update(sessions)
      .set({ status: "paused_crisis" })
      .where(eq(sessions.id, sessionId));

    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: ({ writer }) => {
        writer.write({ type: "data-crisis", data: { active: true } });
        const textId = "crisis-text";
        writer.write({ type: "text-start", id: textId });
        writer.write({ type: "text-delta", id: textId, delta: CRISIS_MESSAGE });
        writer.write({ type: "text-end", id: textId });
      },
      onFinish: async ({ messages: finalMessages }) => {
        await db
          .update(sessions)
          .set({ messages: finalMessages })
          .where(eq(sessions.id, sessionId));
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  // ---- Session context (e.g. active experiments for the weekly review) ----
  let context = "";
  if (protocol.id === "weekly-review") {
    const active = await db
      .select()
      .from(experiments)
      .where(
        and(eq(experiments.userId, userId), eq(experiments.status, "active"))
      );
    context =
      active.length > 0
        ? `Active experiments to review:\n${active
            .map(
              (e) =>
                `- "${e.title}": action = ${e.action}; the user's recorded prediction = "${e.prediction}"`
            )
            .join("\n")}`
        : "The user has no active experiments. Review the week itself, and note they can design an experiment on the Growth page.";
  }

  // ---- Guide agent with protocol tools ----
  let currentStepId = session.currentStepId;
  const savedStoryIds: string[] = [];

  const result = streamText({
    model: MODELS.guide,
    system: buildSystemPrompt(protocol, currentStepId, context),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(4),
    tools: {
      advance_step: tool({
        description:
          "Advance the protocol to its next step once the current step's goal has been met. Returns the next step's goal and constraints.",
        inputSchema: z.object({
          summary: z
            .string()
            .describe("One line: what the current step established."),
        }),
        execute: async () => {
          const next = nextStep(protocol, currentStepId);
          if (!next) {
            return {
              ok: false,
              message:
                "Already on the final step. Use save_story / end_session to close.",
            };
          }
          currentStepId = next.id;
          await db
            .update(sessions)
            .set({ currentStepId: next.id })
            .where(eq(sessions.id, sessionId));
          return {
            ok: true,
            nowOnStep: next.title,
            stepGoal: next.goal,
            stepConstraints: next.guidance,
          };
        },
      }),
      save_story: tool({
        description:
          "Save the episode/record from this session. The narrative must be assembled faithfully from the user's own telling — their words, first person.",
        inputSchema: z.object({
          title: z.string().describe("Short, concrete title for the episode."),
          narrative: z
            .string()
            .describe(
              "The full episode in the user's own words: what happened in sequence, the emotions and intensity they named, and their automatic thoughts verbatim."
            ),
        }),
        execute: async ({ title, narrative }) => {
          const [row] = await db
            .insert(stories)
            .values({ userId, sessionId, title, narrative })
            .returning();
          savedStoryIds.push(row.id);
          return { ok: true, storyId: row.id };
        },
      }),
      end_session: tool({
        description:
          "End the session after the story has been saved and the user has named their takeaway.",
        inputSchema: z.object({
          summary: z
            .string()
            .describe("2-3 sentence session summary including the user's takeaway."),
        }),
        execute: async ({ summary }) => {
          await db
            .update(sessions)
            .set({
              status: "completed",
              summary,
              completedAt: new Date(),
            })
            .where(eq(sessions.id, sessionId));
          return { ok: true };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: finalMessages }) => {
      await db
        .update(sessions)
        .set({ messages: finalMessages })
        .where(eq(sessions.id, sessionId));
      // Story Analyst runs in the background after the response is sent.
      for (const storyId of savedStoryIds) {
        after(async () => {
          try {
            await analyzeStory(storyId);
          } catch (err) {
            console.error("analyzeStory failed", storyId, err);
          }
        });
      }
    },
  });
}
