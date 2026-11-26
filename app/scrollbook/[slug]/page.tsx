import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { episodes, getBook, lite, shortTitle, storySlugs } from "@/lib/content";
import filters from "@/content/filters.json";
import scrollbookData from "@/content/scrollbook.json";
import type { EndCard } from "@/components/scrollbook/StoryEnd";
import EpisodeHero from "@/components/scrollbook/EpisodeHero";
import EpisodeOverlays from "@/components/scrollbook/EpisodeOverlays";
import RelatedSlider from "@/components/scrollbook/RelatedSlider";
import EmailForm from "@/components/EmailForm";
import Footer, { SB_EMAIL } from "@/components/Footer";
import MarkRead from "@/components/scrollbook/MarkRead";
import PlusGate from "@/components/scrollbook/PlusGate";
import StoryComments from "@/components/scrollbook/StoryComments";

const categories = filters.filter((f) => f.group === "category");
const deck = new Map(scrollbookData.deck.map((d) => [d.slug, d]));
const hooks = scrollbookData.hooks as Record<string, string>;
const catOf = (slug: string) => categories.find((f) => f.episodes.includes(slug));
/** A story as a small card: title, picture, category and its one-line hook. */
function card(slug: string): EndCard | null {
  const b = getBook(slug); if (!b) return null;
  return { slug, title: shortTitle(slug, b.title), art: b.image ?? b.cover ?? b.thumb, topic: deck.get(slug)?.topic ?? catOf(slug)?.title ?? "Story", hook: deck.get(slug)?.hook ?? hooks[slug] };
}
let cards: EndCard[] | null = null;
const allCards = () => (cards ??= [...new Set([...storySlugs, ...scrollbookData.deck.map((d) => d.slug), ...Object.keys(hooks)])].map(card).filter((c): c is EndCard => !!c));
/** Up to 3 stories this one leads to: its hand-picked links, then others in its category that have a hook. */
function connectsFor(slug: string, picked: string[]): EndCard[] {
  const out = picked.map(card).filter((c): c is EndCard => !!c);
  const cat = catOf(slug);
  for (const s of cat?.episodes ?? []) {
    if (out.length >= 3) break;
    if (s === slug || out.some((c) => c.slug === s)) continue;
    const c = card(s); if (c?.hook) out.push(c);
  }
  return out.slice(0, 3);
}

export const generateStaticParams = () => [...episodes.map((e) => e.slug), ...storySlugs].map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ep = getBook((await params).slug);
  return { title: ep ? `${ep.title} | Scrollbook` : "Story" };
}

/** Scrollbook: read-and-listen page, duplicated from the episode page as the starting point for the new product. */
export default async function ScrollbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const ep = getBook((await params).slug);
  if (!ep) notFound();
  // the end of the story: "This connects to…" (hand-picked links first, then the same category) and tomorrow's story
  const connects = connectsFor(ep.slug, ep.deeper?.more ?? []);
  const pool = allCards().filter((c) => c.slug !== ep.slug);
  const related = (ep.related ?? episodes.filter((e) => e.slug !== ep.slug).slice(0, 6).map((e) => e.slug)).map(getBook).filter((e) => !!e);
  return (
    <div data-ep-theme={ep.theme}>
      {ep.themeColors && (
        // per-episode theme from the CMS, applied to :root exactly like the live page's inline style
        <style>{`:root:has([data-ep-theme]){--theme-light:${ep.themeColors.light};--theme-dark:${ep.themeColors.dark};--theme-a400:${ep.themeColors.a400};--theme-a500:${ep.themeColors.a500};--theme-a600:${ep.themeColors.a600};}`}</style>
      )}
      <div className="ep" data-theme="episode">
        <EpisodeHero ep={ep} connects={connects} pool={pool} />
        <div className="ep-rule" aria-hidden />
        <section className="ep-cta" aria-label="Newsletter">
          <div className="ep-cta__inner">
            <EmailForm id="ep-email" dark eyebrow={SB_EMAIL.eyebrow} copy={SB_EMAIL.copy} cta="subscribe" gap="base" />
          </div>
        </section>
      </div>
      <div style={{ background: "var(--c-cream)", color: "var(--c-ink)" }} data-theme="hidden">
        <div className="spacer-2xl" />
        <RelatedSlider episodes={related.map(lite)} />
        <div className="spacer-3xl" />
      </div>
      <Footer />
      <EpisodeOverlays ep={ep} />
      <MarkRead slug={ep.slug} />
      <PlusGate slug={ep.slug} />
      <StoryComments slug={ep.slug} />
      {/* audio player hidden on Scrollbook for now; bring it back by restoring: <EpisodePlayer ep={lite(ep)} /> */}
    </div>
  );
}
