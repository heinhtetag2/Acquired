import type { Metadata } from "next";
import scrollbookData from "@/content/scrollbook.json";
import filters from "@/content/filters.json";
import { getBook, storySlugs, type Episode } from "@/lib/content";
import Deck, { type DeckCard } from "@/components/scrollbook/Deck";

export const metadata: Metadata = { title: "Scrollbook | Discover one story at a time" };

const FALLBACK = { dark: "#0c3b3a", light: "#e1eed8", a400: "#63bfbc", a500: "#3ca7a3" };
const curated = new Map(scrollbookData.deck.map((d) => [d.slug, d]));
// "Did you know?" lines for stories outside the main deck (e.g. in the Film topic deck)
const extraHooks = ((scrollbookData as unknown as { hooks?: Record<string, string> }).hooks ?? {});
// short titles for cards whose episode title runs long (e.g. "Convoy (with CEO Dan Lewis)" → "Convoy"); story pages keep the full one
const cardTitles = ((scrollbookData as unknown as { cardTitles?: Record<string, string> }).cardTitles ?? {});
const industries = filters.filter((f) => f.group === "category");
// which topics (industry slugs) each story belongs to, so Discover can deal your interests first
const groupsOf = new Map<string, string[]>();
for (const f of industries) for (const s of f.episodes) groupsOf.set(s, [...(groupsOf.get(s) ?? []), f.slug]);
// a usable teaser line (the clone still has "Sample …" placeholder copy on many episodes)
const teaser = (e: Episode) => [e.subtitle, e.tagline, e.heroLine, e.description].find((t) => t && !/^sample\b/i.test(t.trim()));

function card(slug: string, topicTitle?: string): DeckCard | null {
  const e = getBook(slug); // book overrides (e.g. title) win over the episode
  if (!e) return null;
  const d = curated.get(slug);
  const t = e.themeColors;
  return {
    slug, title: cardTitles[slug] ?? e.title,
    topic: d?.topic ?? topicTitle ?? "Story", min: d?.min ?? 7,
    hook: d?.hook ?? extraHooks[slug] ?? teaser(e), fact: !!d || !!extraHooks[slug], isNew: !!(d && "new" in d && d.new), out: d && "out" in d ? (d.out as DeckCard["out"]) : undefined,
    art: e.image ?? e.cover ?? e.thumb,
    motion: e.motion, // same picture as the story page's cover, so the open/close morph is seamless
    colors: t ? { dark: t.dark, light: t.light, a400: t.a400, a500: t.a500 } : FALLBACK,
    groups: groupsOf.get(slug),
  };
}

// quick filters (from the search panel): decks that cut across topics. "unread" is narrowed to what you haven't opened in the browser.
const allSlugs = [...new Set([...scrollbookData.deck.map((d) => d.slug), ...groupsOf.keys()])];
const QUICK: { slug: string; title: string; episodes: string[]; seen?: "unread" | "read" }[] = [
  { slug: "quick", title: "Quick reads", episodes: scrollbookData.deck.filter((d) => d.min <= 6).map((d) => d.slug) },
  { slug: "new", title: "Just added", episodes: [...new Set([...scrollbookData.deck.filter((d) => "new" in d && d.new).map((d) => d.slug), ...storySlugs])] },
  { slug: "unread", title: "New to me", episodes: allSlugs, seen: "unread" },
  { slug: "deep", title: "Deep dives", episodes: scrollbookData.deck.filter((d) => d.min >= 7).map((d) => d.slug) },
  { slug: "again", title: "Read again", episodes: allSlugs, seen: "read" },
];

/** Home: a swipeable deck of stories (the previous home page lives at /home-classic).
    `?c=<topic or collection slug>` shuffles just that group (from the Library's "Shuffle" buttons). */
export default async function Home({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const quick = c ? QUICK.find((q) => q.slug === c) : undefined;
  const group = quick ?? (c ? filters.find((f) => f.slug === c && f.group !== "season") : undefined);
  // a topic or collection deck labels its cards with that name; quick filters keep each story's own topic
  const cards = (group ? group.episodes.map((s) => card(s, quick ? industries.find((f) => f.episodes.includes(s))?.title : group.title)) : scrollbookData.deck.map((d) => card(d.slug))).filter((x): x is DeckCard => !!x);
  // the main deck also gets every other story by topic; the client adds the ones matching your interests
  const extra = group ? [] : [...groupsOf.keys()].filter((s) => !curated.has(s)).map((s) => card(s, industries.find((f) => f.episodes.includes(s))?.title)).filter((x): x is DeckCard => !!x);
  return <Deck key={group?.slug ?? "all"} cards={cards} extra={extra} topic={group ? { slug: group.slug, title: group.title } : undefined} seenFilter={quick?.seen} />;
}
