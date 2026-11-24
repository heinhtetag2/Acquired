import type { Metadata } from "next";
import filters from "@/content/filters.json";
import { episodes, getBook } from "@/lib/content";
import LibraryView, { type Shelf, type Story } from "@/components/scrollbook/LibraryView";

export const metadata: Metadata = { title: "Library | Scrollbook" };

// Collections shown as stacked covers: the hand-picked lists first, then company deep-dives.
const COLLECTIONS = ["must-listen", "niche-gems", "interviews", "disney", "nvidia", "microsoft", "alphabet", "amazon", "apple", "berkshire-hathaway"];

/** Library: saved stories, collections and topics (the old PDF-companion page lives at /library-classic). */
export default function LibraryPage() {
  const stories: Record<string, Story> = {};
  for (const e of episodes) {
    const b = getBook(e.slug) ?? e; // Scrollbook titles win
    stories[e.slug] = { slug: e.slug, title: b.title, art: b.image ?? b.cover ?? b.thumb, color: b.color };
  }
  const shelf = (f: (typeof filters)[number]): Shelf => ({ slug: f.slug, title: f.title, eyebrow: f.eyebrow, href: f.href, stories: f.episodes.filter((s) => stories[s]) });
  const collections = COLLECTIONS.map((slug) => filters.find((f) => f.slug === slug && f.group !== "season")).filter((f) => !!f).map(shelf);
  const topics = filters.filter((f) => f.group === "industry").map(shelf).filter((t) => t.stories.length).sort((a, b) => b.stories.length - a.stories.length);
  return <LibraryView stories={stories} collections={collections} topics={topics} />;
}
