import type { Metadata } from "next";
import scrollbookData from "@/content/scrollbook.json";
import filters from "@/content/filters.json";
import { getBook, type Episode } from "@/lib/content";
import Deck, { type DeckCard } from "@/components/scrollbook/Deck";

export const metadata: Metadata = { title: "Scrollbook | Discover one story at a time" };

const FALLBACK = { dark: "#0c3b3a", light: "#e1eed8", a400: "#63bfbc", a500: "#3ca7a3" };
const curated = new Map(scrollbookData.deck.map((d) => [d.slug, d]));
// a usable teaser line (the clone still has "Sample …" placeholder copy on many episodes)
const teaser = (e: Episode) => [e.subtitle, e.tagline, e.heroLine, e.description].find((t) => t && !/^sample\b/i.test(t.trim()));

function card(slug: string, topicTitle?: string): DeckCard | null {
  const e = getBook(slug); // book overrides (e.g. title) win over the episode
  if (!e) return null;
  const d = curated.get(slug);
  const t = e.themeColors;
  return {
    slug, title: e.title,
    topic: d?.topic ?? topicTitle ?? "Story", min: d?.min ?? 7,
    hook: d?.hook ?? teaser(e), fact: !!d, isNew: !!(d && "new" in d && d.new),
    art: e.image ?? e.cover ?? e.thumb, // same picture as the story page's cover, so the open/close morph is seamless
    colors: t ? { dark: t.dark, light: t.light, a400: t.a400, a500: t.a500 } : FALLBACK,
  };
}

/** Home: a swipeable deck of stories (the previous home page lives at /home-classic).
    `?c=<topic or collection slug>` shuffles just that group (from the Library's "Shuffle" buttons). */
export default async function Home({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const group = c ? filters.find((f) => f.slug === c && f.group !== "season") : undefined;
  const cards = (group ? group.episodes.map((s) => card(s, group.title)) : scrollbookData.deck.map((d) => card(d.slug))).filter((x): x is DeckCard => !!x);
  return <Deck key={group?.slug ?? "all"} cards={cards} topic={group ? { slug: group.slug, title: group.title } : undefined} />;
}
