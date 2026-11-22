import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { episodes, getEpisode, lite } from "@/lib/content";
import EpisodeHero from "@/components/episode/EpisodeHero";
import EpisodeOverlays from "@/components/episode/EpisodeOverlays";
import EpisodePlayer from "@/components/episode/EpisodePlayer";
import RelatedSlider from "@/components/episode/RelatedSlider";
import EmailForm from "@/components/EmailForm";
import Footer from "@/components/Footer";

export const generateStaticParams = () => episodes.map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ep = getEpisode((await params).slug);
  return { title: ep ? `${ep.title} | Acquired Podcast (clone)` : "Episode" };
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const ep = getEpisode((await params).slug);
  if (!ep) notFound();
  const related = (ep.related ?? episodes.filter((e) => e.slug !== ep.slug).slice(0, 6).map((e) => e.slug)).map(getEpisode).filter((e) => !!e);
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
            <EmailForm id="ep-email" dark eyebrow="Emails from Ben & David" copy="Our key takeaways, research photos, hints at the next episode, and your vote on future topics." cta="subscribe" gap="base" />
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
      <EpisodePlayer ep={lite(ep)} />
    </div>
  );
}
