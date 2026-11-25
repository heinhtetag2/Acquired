import type { Metadata } from "next";
import filters from "@/content/filters.json";
import scrollbookData from "@/content/scrollbook.json";
import { episodes, getBook, shortTitle, storySlugs } from "@/lib/content";
import ProfilePage, { type StoryInfo } from "@/components/scrollbook/ProfilePage";

export const metadata: Metadata = { title: "You | Scrollbook" };

/** Your profile: today's goal, streak, reading stats, top topics, interests, and the rest of the site's pages. */
export default function MeRoute() {
  const industries = filters.filter((f) => f.group === "category");
  const curated = new Map(scrollbookData.deck.map((d) => [d.slug, d.topic]));
  const stories: Record<string, StoryInfo> = {};
  for (const slug of [...storySlugs, ...episodes.map((e) => e.slug)]) {
    const b = getBook(slug); if (!b) continue;
    stories[slug] = { title: shortTitle(slug, b.title), art: b.thumb ?? b.image ?? b.cover, topic: curated.get(slug) ?? industries.find((f) => f.episodes.includes(slug))?.title ?? "Story" };
  }
  return <ProfilePage stories={stories} topics={industries.map((f) => ({ slug: f.slug, title: f.title }))} />;
}
