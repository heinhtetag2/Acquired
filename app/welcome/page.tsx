import type { Metadata } from "next";
import filters from "@/content/filters.json";
import scrollbookData from "@/content/scrollbook.json";
import { getBook } from "@/lib/content";
import Onboarding, { type OnboardTopic } from "@/components/scrollbook/Onboarding";

export const metadata: Metadata = { title: "Welcome | Scrollbook" };

const art = (slug: string) => { const b = getBook(slug); return b?.thumb ?? b?.image ?? b?.cover; };

/** First-run onboarding: what Scrollbook is, how the deck works, your interests, a daily goal and your name.
    `?step=interests` jumps straight to editing interests (from the profile). */
export default function WelcomeRoute() {
  // each category gets its own cover: the first of its stories whose picture no earlier category used
  const used = new Set<string>();
  const topics: OnboardTopic[] = filters
    .filter((f) => f.group === "category")
    .sort((a, b) => b.episodes.length - a.episodes.length)
    .map((f) => {
      const pic = f.episodes.map(art).find((a) => a && !used.has(a)) ?? f.episodes.map(art).find(Boolean);
      if (pic) used.add(pic);
      return { slug: f.slug, title: f.title, count: f.episodes.length, stories: f.episodes, art: pic };
    });
  // three real covers for the welcome stack
  const stack = scrollbookData.deck.slice(0, 3).map((d) => ({ slug: d.slug, title: getBook(d.slug)?.title ?? d.slug, art: art(d.slug) }));
  return <Onboarding topics={topics} stack={stack} />;
}
