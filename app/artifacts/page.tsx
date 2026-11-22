import Link from "next/link";
import type { Metadata } from "next";
import artifacts from "@/content/artifacts.json";
import Footer from "@/components/Footer";
import { ArrowUpRight } from "@/components/Icons";

export const metadata: Metadata = { title: "Artifacts | Acquired Podcast (clone)" };

export default function ArtifactsPage() {
  return (
    <>
      <main id="main" className="page artifacts" data-theme="light-fill">
        <div className="spacer-2xl" />
        <div className="page-head">
          <h1 className="t-h2">All Artifacts</h1>
          <div className="spacer-4xs" />
          <p className="t-body-140">The artifacts shelf: the images, documents, and videos referenced in episodes.</p>
        </div>
        <div className="spacer-base" /><div className="spacer-xs" />
        <div className="artifacts__groups">
          {artifacts.map((g) => (
            <section key={g.slug} className="artifacts__group" aria-labelledby={`art-${g.slug}`}>
              <div className="artifacts__head">
                <Link id={`art-${g.slug}`} href={`/artifacts/${g.slug}`} className="t-label">{g.title}</Link>
                <ArrowUpRight width={16} height={16} />
              </div>
              <div className="spacer-2xs" />
              <div className="artifacts__strip" tabIndex={0} role="region" aria-label={`${g.title} artifacts`}>
                {g.frames.map((src) => <Link key={src} href={`/artifacts/${g.slug}`} className="artifacts__frame"><img src={src} alt="" loading="lazy" /></Link>)}
              </div>
            </section>
          ))}
        </div>
      </main>
      <div className="spacer-2xl" style={{ background: "var(--c-cream)" }} />
      <Footer variant="console" />
    </>
  );
}
