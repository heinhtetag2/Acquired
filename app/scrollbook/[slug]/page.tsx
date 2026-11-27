import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { episodes, getBook, lite, storySlugs } from "@/lib/content";
import EpisodeHero from "@/components/scrollbook/EpisodeHero";
import EpisodeOverlays from "@/components/scrollbook/EpisodeOverlays";
import RelatedSlider from "@/components/scrollbook/RelatedSlider";
import EmailForm from "@/components/EmailForm";
import Footer, { SB_EMAIL } from "@/components/Footer";
import MarkRead from "@/components/scrollbook/MarkRead";
import PlusGate from "@/components/scrollbook/PlusGate";
import StoryComments from "@/components/scrollbook/StoryComments";
import AskStory from "@/components/scrollbook/AskStory";

export const generateStaticParams = () => [...episodes.map((e) => e.slug), ...storySlugs].map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ep = getBook((await params).slug);
  return { title: ep ? `${ep.title} | Scrollbook` : "Story" };
}

/** Scrollbook: read-and-listen page, duplicated from the episode page as the starting point for the new product. */
export default async function ScrollbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const ep = getBook((await params).slug);
  if (!ep) notFound();
  const related = (ep.related ?? episodes.filter((e) => e.slug !== ep.slug).slice(0, 6).map((e) => e.slug)).map(getBook).filter((e) => !!e);
  return (
    <div data-ep-theme={ep.theme}>
      {ep.themeColors && (
        // per-episode theme from the CMS, applied to :root exactly like the live page's inline style
        <style>{`:root:has([data-ep-theme]){--theme-light:${ep.themeColors.light};--theme-dark:${ep.themeColors.dark};--theme-a400:${ep.themeColors.a400};--theme-a500:${ep.themeColors.a500};--theme-a600:${ep.themeColors.a600};}`}</style>
      )}
      <div className="ep" data-theme="episode">
        <EpisodeHero ep={ep} />
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
      {!!ep.story?.length && <AskStory slug={ep.slug} suggestions={ep.ask} />}
      <StoryComments slug={ep.slug} />
      {/* audio player hidden on Scrollbook for now; bring it back by restoring: <EpisodePlayer ep={lite(ep)} /> */}
    </div>
  );
}
