import { notFound } from "next/navigation";
import { acq2, getAcq2, lite } from "@/lib/content";
import EpisodeHero from "@/components/episode/EpisodeHero";
import EpisodePlayer from "@/components/episode/EpisodePlayer";
import EmailForm from "@/components/EmailForm";
import Footer from "@/components/Footer";

// Not in the reference set: ACQ2 episode pages reuse the Acquired episode template with the teal theme.
export const dynamicParams = false;
export const generateStaticParams = () => acq2.map((e) => ({ slug: e.slug }));

export default async function Acq2Episode({ params }: { params: Promise<{ slug: string }> }) {
  const ep = getAcq2((await params).slug);
  if (!ep) notFound();
  return (
    <div data-ep-theme="teal">
      <div className="ep" data-theme="episode">
        <EpisodeHero ep={{ ...ep, tags: [{ label: "ACQ2", href: "/acq2" }] }} />
        <div className="ep-rule" aria-hidden />
        <section className="ep-cta" aria-label="Newsletter">
          <div className="ep-cta__inner"><EmailForm id="ep-email" dark eyebrow="Emails from Ben & David" copy="Our key takeaways, research photos, hints at the next episode, and your vote on future topics." cta="subscribe" gap="base" /></div>
        </section>
      </div>
      <Footer />
      <EpisodePlayer ep={lite(ep)} />
    </div>
  );
}
