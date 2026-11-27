import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/* Claude for Scrollbook's server routes ("Ask this story", the writing studio).
   Turn it on by adding ANTHROPIC_API_KEY to .env.local and restarting the dev server. Without a key the routes still
   answer: Ask falls back to searching the story's own text, and the studio says what's missing.
   The client always talks to Anthropic's API: ANTHROPIC_BASE_URL in a developer's shell (set by some tools) is ignored. */
export const MODEL = "claude-opus-5-5";
export const aiOn = () => !!process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;
export const claude = () => (client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, baseURL: "https://api.anthropic.com" }));

// if a request is declined by a safety check, the API retries it on a suitable model by itself
export const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

/** The text of the reply (structured outputs return their JSON as one text block). */
export function replyText(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("");
}
