import HeroWall from "@/components/HeroWall";
import PhotoHero from "@/components/PhotoHero";
import PressQuotes from "@/components/PressQuotes";
import LatestEpisodes from "@/components/LatestEpisodes";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import { heroEpisodes, latestEpisodes, lite } from "@/lib/content";

/** Classic Home: an unchanged copy of the home page, kept for reference while "/" is redesigned. */
export default function HomeClassic() {
  return (
    <>
      <HeroWall episodes={heroEpisodes.map(lite)} />
      <main id="main" className="home-next">
        <div className="spacer-2xl" />
        <PhotoHero />
        <div style={{ background: "var(--c-cream)" }} data-theme="light-fill-mobile">
          <PressQuotes />
          <LatestEpisodes episodes={latestEpisodes} />
          <div className="spacer-4xl" />
          <Testimonials />
          <div className="spacer-4xl" />
        </div>
      </main>
      <FloatingCta />
      <Footer />
    </>
  );
}
