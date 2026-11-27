import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import scrollbookData from "@/content/scrollbook.json";
import { FALLBACK, MODEL, aiOn, claude, replyText } from "@/lib/claude";

/* The writing studio (/studio): sources in, a story draft out, in Scrollbook's shape and house style, written only from
   those sources. It's a first draft for a person to edit, check against the sources, and paste into content/scrollbook.json. */
export const maxDuration = 300;

export type DraftSource = { label: string; url: string; text: string };
export type DraftReply = { slug: string; deck: Record<string, unknown>; story: Record<string, unknown>; cardTitle: string; notes: string[] };

const TOPICS = [...new Set(scrollbookData.deck.map((d) => d.topic))];
const MAX_CHARS = 300_000;

const SYSTEM = `You write first drafts of stories for Scrollbook, an app of short, sourced true stories that people discover one card at a time.

House style:
- A story takes 3 to 5 minutes to read: an overview of 2 short paragraphs, then 3 to 5 sections of 1 to 3 paragraphs each.
- Plain, warm English for a curious general reader. Short sentences. Explain any jargon the first time it appears. No hype words, no clichés, no emoji.
- The hook is one sentence that makes someone want to tap the card: a surprising, true detail from the sources, not a summary.
- Section headings are short (2 to 5 words) and specific.
- Include exactly one pull quote: a single striking line of your own that sums up the story. It is not a quotation from a source.
- Quick facts: 4 to 6 short label/value pairs (dates, people, places, numbers).
- Suggested questions: 3 questions a reader might ask that the story itself answers.

Accuracy is the most important rule. Use only facts stated in the sources given. Never add facts from your own knowledge, even ones you are sure of. If the sources disagree, follow the most authoritative one and add a note. If something a reader would expect is missing from the sources, leave it out and add a note saying so. In "sources", list the numbers of the sources you actually used.`;

const str = { type: "string" };
const strs = { type: "array", items: str };
const FORMAT = {
  type: "json_schema" as const,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "cardTitle", "subtitle", "description", "hook", "minutes", "overview", "sections", "pullQuote", "facts", "questions", "sources", "notes"],
    properties: {
      title: { ...str, description: "Full story title, e.g. \"Valorant's Hush: The Agent Who Moves Things With Her Mind\"" },
      cardTitle: { ...str, description: "Short title for the card, 2 to 5 words" },
      subtitle: { ...str, description: "One sentence under the title" },
      description: { ...str, description: "Two sentences for sharing and search" },
      hook: str,
      minutes: { type: "integer", description: "Reading time in minutes, 3 to 5" },
      overview: strs,
      sections: { type: "array", items: { type: "object", additionalProperties: false, required: ["heading", "paragraphs"], properties: { heading: str, paragraphs: strs } } },
      pullQuote: str,
      facts: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "value"], properties: { label: str, value: str } } },
      questions: strs,
      sources: { type: "array", items: { type: "integer" } },
      notes: { ...strs, description: "Things for the editor to check: gaps, conflicts between sources, anything uncertain" },
    },
  },
};

type Draft = {
  title: string; cardTitle: string; subtitle: string; description: string; hook: string; minutes: number; overview: string[];
  sections: { heading: string; paragraphs: string[] }[]; pullQuote: string; facts: { label: string; value: string }[];
  questions: string[]; sources: number[]; notes: string[];
};

const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export async function POST(req: Request) {
  if (!aiOn()) return NextResponse.json({ error: "The studio needs Claude: add ANTHROPIC_API_KEY to .env.local, then restart the dev server." }, { status: 503 });
  let body: { idea?: unknown; topic?: unknown; sources?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const idea = typeof body.idea === "string" ? body.idea.trim().slice(0, 1000) : "";
  const topic = typeof body.topic === "string" && TOPICS.includes(body.topic) ? body.topic : TOPICS[0];
  const sources = (Array.isArray(body.sources) ? body.sources : [])
    .filter((s): s is DraftSource => !!s && typeof s.text === "string" && s.text.trim().length > 40)
    .map((s) => ({ label: String(s.label ?? "").trim() || "Untitled source", url: String(s.url ?? "").trim(), text: s.text.trim() }));
  if (!idea) return NextResponse.json({ error: "Say what the story is about." }, { status: 400 });
  if (!sources.length) return NextResponse.json({ error: "Paste the text of at least one source." }, { status: 400 });
  if (sources.reduce((n, s) => n + s.text.length, 0) > MAX_CHARS) return NextResponse.json({ error: "The sources are too long together. Paste the relevant parts only." }, { status: 413 });

  const docs = sources.map((s, i) => `<source n="${i + 1}" title="${s.label.replace(/"/g, "'")}" url="${s.url}">\n${s.text}\n</source>`).join("\n\n");
  try {
    const msg = await claude().beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      ...FALLBACK,
      output_config: { effort: "medium", format: FORMAT },
      system: SYSTEM,
      messages: [{ role: "user", content: `${docs}\n\nWrite a Scrollbook story draft about: ${idea}\nTopic: ${topic}` }],
    }).finalMessage();
    if (msg.stop_reason === "refusal") return NextResponse.json({ error: "Claude declined to write this one. Try different sources or a different angle." }, { status: 422 });
    if (msg.stop_reason === "max_tokens") return NextResponse.json({ error: "The draft ran too long. Try fewer or shorter sources." }, { status: 422 });
    const d = JSON.parse(replyText(msg.content)) as Draft;
    const slug = slugify(d.cardTitle || d.title);
    const used = [...new Set(d.sources)].map((n) => sources[n - 1]).filter((s) => !!s?.url).map((s) => ({ label: s.label, url: s.url }));
    const story: Record<string, unknown> = {
      slug, title: d.title, date: new Date().toLocaleDateString("en-CA"), subtitle: d.subtitle, description: d.description,
      overview: d.overview,
      story: d.sections.flatMap((sec, i) => [{ h: sec.heading, p: sec.paragraphs }, ...(i === 0 && d.pullQuote ? [{ quote: d.pullQuote }] : [])]),
      facts: d.facts, ask: d.questions.slice(0, 3),
      deeper: { updated: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }), sources: used },
    };
    const deck = { slug, topic, min: Math.min(8, Math.max(2, d.minutes || 4)), new: true, hook: d.hook };
    return NextResponse.json({ slug, deck, story, cardTitle: d.cardTitle, notes: d.notes } satisfies DraftReply);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return NextResponse.json({ error: "Claude rejected the API key in .env.local." }, { status: 502 });
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "Claude is busy right now. Try again in a minute." }, { status: 429 });
    if (e instanceof Anthropic.APIError) { console.error(`[draft] API error ${e.status}: ${e.message}`); return NextResponse.json({ error: "Claude couldn't write the draft. Try again." }, { status: 502 }); }
    console.error("[draft]", e);
    return NextResponse.json({ error: "Something went wrong writing the draft." }, { status: 500 });
  }
}

/** Whether the studio can write (the page asks before showing the form). */
export async function GET() { return NextResponse.json({ ai: aiOn(), topics: TOPICS }); }
