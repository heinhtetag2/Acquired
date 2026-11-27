"use client";
import type { AskReply } from "@/app/api/ask/route";

/* "Ask this story" on the client: the call to /api/ask, and the event that opens the chat (AskStory) about a passage
   the reader selected (select → Ask in StoryComments' toolbar). */
export const ASK_OPEN = "sb:ask-open"; // detail: { quote }

export type AskTurn = { q: string; quote?: string; reply?: AskReply; error?: string };

export async function askStory(slug: string, question: string, quote?: string): Promise<AskTurn> {
  try {
    const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, question, quote }) });
    const data = await res.json();
    return res.ok ? { q: question, quote, reply: data as AskReply } : { q: question, quote, error: data.error ?? "Something went wrong. Try again." };
  } catch { return { q: question, quote, error: "Couldn't reach Scrollbook. Check your connection and try again." }; }
}
