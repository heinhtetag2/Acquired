import type { Metadata } from "next";
import filters from "@/content/filters.json";
import scrollbookData from "@/content/scrollbook.json";
import { episodes, getBook, storySlugs, type Episode } from "@/lib/content";
import ShelfPage, { type ShelfItem } from "@/components/scrollbook/ShelfPage";

export const metadata: Metadata = { title: "Shelf | Scrollbook" };

const curated = new Map(scrollbookData.deck.map((d) => [d.slug, d]));
const topics = filters.filter((f) => f.group === "industry");
const topicOf = new Map<string, (typeof topics)[number]>();
for (const t of topics) for (const s of t.episodes) if (!topicOf.has(s)) topicOf.set(s, t);
// a usable teaser line (the clone still has "Sample …" placeholder copy on many episodes)
const teaser = (e: Episode) => [e.subtitle, e.tagline, e.heroLine, e.description].find((t) => t && !/^sample\b/i.test(t.trim()));

/** Shelf (the Episodes tab): your saved stories to come back to. Classic Episodes keeps the original list. */
export default function ShelfRoute() {
  // podcast episodes + Scrollbook-only stories (e.g. Avengers: Doomsday)
  const all: Episode[] = [...storySlugs.map((s) => getBook(s)).filter((b): b is NonNullable<typeof b> => !!b), ...episodes];
  const items: ShelfItem[] = all.map((e) => {
    const b = getBook(e.slug) ?? e;
    const d = curated.get(e.slug);
    const t = topicOf.get(e.slug);
    return { slug: e.slug, title: b.title, art: b.thumb ?? b.image ?? b.cover, topic: d?.topic ?? t?.title ?? "Story", topicSlug: t?.slug, teaser: d?.hook ?? teaser(b), min: d?.min ?? 7 };
  });
  return <ShelfPage items={items} topics={topics.map((t) => ({ slug: t.slug, title: t.title }))} />;
}
