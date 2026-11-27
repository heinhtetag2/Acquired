import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getBook } from "@/lib/content";
import { FALLBACK, MODEL, aiOn, claude, replyText } from "@/lib/claude";
import { storyDoc, storyPrompt, type StoryDoc } from "@/lib/storyText";

/* "Ask this story": a reader's question about the story they're reading, answered only from that story and its
   sources, with the sources it leans on. With Claude off (no API key) it answers by finding the story's own sentences. */

export type AskReply = { answer: string; found: boolean; sources: { label: string; url: string }[]; mode: "ai" | "search" };

const SYSTEM = `You answer readers' questions about one Scrollbook story. Scrollbook is an app of short, sourced true stories.
Answer only from the story text and the sources listed with it. Never add facts from your own knowledge, even if you know them.
If the story doesn't answer the question, set found to false and say so in one short sentence, then point to something the story does cover that is close to it.
Write 1 to 3 short sentences in plain, friendly English for a general reader. No markdown, no lists, no paragraph numbers.
If the reader selected a passage, it comes in <passage> before their question, and the question is about that passage: explain it, give its context from the rest of the story, or say what the story adds to it. Don't just repeat the passage.
In "sources", list the numbers of the sources from <sources> that back the answer, or an empty list.`;

const FORMAT = {
  type: "json_schema" as const,
  schema: {
    type: "object",
    properties: { answer: { type: "string" }, found: { type: "boolean" }, sources: { type: "array", items: { type: "integer" } } },
    required: ["answer", "found", "sources"],
    additionalProperties: false,
  },
};

export async function POST(req: Request) {
  let body: { slug?: unknown; question?: unknown; quote?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const quote = typeof body.quote === "string" ? body.quote.trim().slice(0, 600) : ""; // the passage the reader selected, if any
  const book = typeof body.slug === "string" ? getBook(body.slug) : undefined;
  if (!book?.story?.length) return NextResponse.json({ error: "No such story" }, { status: 404 });
  if (question.length < 3 || question.length > 300) return NextResponse.json({ error: "Ask a question between 3 and 300 characters." }, { status: 400 });

  const doc = storyDoc(book);
  if (!aiOn()) return NextResponse.json(search(doc, question, quote));

  try {
    const res = await claude().beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      ...FALLBACK,
      output_config: { effort: "low", format: FORMAT },
      // the story is the same for every question about it, so it's cached
      system: [{ type: "text", text: SYSTEM }, { type: "text", text: storyPrompt(doc), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: quote ? `<passage>${quote}</passage>\n\n${question}` : question }],
    });
    if (res.stop_reason === "refusal") return NextResponse.json({ answer: "I can't answer that one. Try asking about something in the story.", found: false, sources: [], mode: "ai" } satisfies AskReply);
    const out = JSON.parse(replyText(res.content)) as { answer: string; found: boolean; sources: number[] };
    const sources = [...new Set(out.sources)].map((n) => doc.sources[n - 1]).filter((s) => !!s);
    return NextResponse.json({ answer: out.answer, found: out.found, sources, mode: "ai" } satisfies AskReply);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) console.error("[ask] ANTHROPIC_API_KEY was rejected");
    else if (e instanceof Anthropic.RateLimitError) console.error("[ask] rate limited");
    else if (e instanceof Anthropic.APIError) console.error(`[ask] API error ${e.status}: ${e.message}`);
    else console.error("[ask]", e);
    // Claude is unreachable: still give the reader something from the story itself
    return NextResponse.json(search(doc, question, quote));
  }
}

/* No Claude: find the story's sentences that share the most words with the question. */
const STOP = new Set("a an and are as at be but by did do does for from had has have he her his how i if in into is it its me my of on or she so than that the their them then there they this to was we were what when where which who why will with would you your about after before could should can just also more most out up".split(" "));
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).map((w) => w.replace(/'s$/, "")).filter((w) => w.length > 2 && !STOP.has(w));
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");

function search(doc: StoryDoc, question: string, quote = ""): AskReply {
  // about a passage: look for the other sentences that share its words (never the passage itself)
  const q = new Set(words(`${question} ${quote}`).map(stem));
  // "the passage itself" = a sentence the selection covers, or covers most of; a short selection ("Shanghai") doesn't
  // rule out every other sentence that mentions it
  const inQuote = (s: string) => !!quote && (quote.includes(s.trim()) || (s.includes(quote) && quote.length >= s.length * 0.5));
  const sentences = doc.paras.filter((p) => !/^(Pull quote|Video): /.test(p)).flatMap((p) => p.replace(/^[^:]{1,60}: /, "").split(/(?<=[.!?])\s+(?=[A-Z])/)).concat(doc.facts.map((f) => f + "."));
  // a word that's in almost every sentence ("Apple" in a story about the iPhone) says little; a rare one ("titanium") a lot
  const bags = sentences.map((s) => new Set(words(s).map(stem)));
  const weight = (w: string) => 1 / bags.filter((b) => b.has(w)).length;
  const scored = bags.map((b, i) => ({ s: sentences[i], i, n: [...q].filter((w) => b.has(w)).reduce((t, w) => t + weight(w), 0) })).filter((x) => x.n > 0 && !inQuote(x.s));
  if (!q.size || !scored.length) return { answer: "This story doesn't say. Try asking about something it covers.", found: false, sources: [], mode: "search" };
  const top = scored.sort((a, b) => b.n - a.n || a.i - b.i);
  // the best sentence, plus the runner-up only when it's nearly as good
  const best = top.filter((x, k) => k === 0 || (k === 1 && x.n >= top[0].n * 0.6)).sort((a, b) => a.i - b.i);
  return { answer: best.map((x) => x.s).join(" "), found: true, sources: [], mode: "search" };
}
