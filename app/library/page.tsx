import type { Metadata } from "next";
import filters from "@/content/filters.json";
import { episodes, getBook, shortTitle, storySlugs } from "@/lib/content";
import LibraryView, { type Shelf, type Story } from "@/components/scrollbook/LibraryView";

export const metadata: Metadata = { title: "Library | Scrollbook" };

// Collections shown as stacked covers: one per company, every story about it in one place.
const COLLECTIONS = ["alphabet", "apple", "microsoft", "amazon", "nvidia", "disney", "berkshire-hathaway"];

/** Library: company collections and every category. */
export default function LibraryPage() {
  const stories: Record<string, Story> = {};
  for (const e of episodes) {
    const b = getBook(e.slug) ?? e; // Scrollbook titles win
    stories[e.slug] = { slug: e.slug, title: shortTitle(e.slug, b.title), art: b.image ?? b.cover ?? b.thumb, color: b.color };
  }
  // Scrollbook-only stories (e.g. Avengers: Doomsday, Spider-Man: Brand New Day) sit on their topics too
  for (const slug of storySlugs) {
    const b = getBook(slug); if (!b) continue;
    stories[slug] = { slug, title: b.title, art: b.image ?? b.cover ?? b.thumb, color: b.color };
  }
  const shelf = (f: (typeof filters)[number]): Shelf => ({ slug: f.slug, title: f.title, eyebrow: f.eyebrow, href: f.href, stories: f.episodes.filter((s) => stories[s]) });
  const collections = COLLECTIONS.map((slug) => filters.find((f) => f.slug === slug && f.group === "series")).filter((f) => !!f).map((f) => ({ ...shelf(f), eyebrow: "Company" }));
  const topics = filters.filter((f) => f.group === "category").map(shelf).filter((t) => t.stories.length).sort((a, b) => b.stories.length - a.stories.length);
  return <LibraryView stories={stories} collections={collections} topics={topics} />;
}
