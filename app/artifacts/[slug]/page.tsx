import Link from "next/link";
import { notFound } from "next/navigation";
import artifacts from "@/content/artifacts.json";
import { getEpisode } from "@/lib/content";
import Footer from "@/components/Footer";

// Not in the reference set: a simple per-episode shelf so links from /artifacts resolve.
export const dynamicParams = false;
export const generateStaticParams = () => artifacts.map((g) => ({ slug: g.slug }));

export default async function ArtifactShelf({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = artifacts.find((a) => a.slug === slug);
  if (!g) notFound();
  const all = getEpisode(slug)?.artifacts ?? g.frames;
  return (
    <>
      <main id="main" className="page artifacts" data-theme="light-fill">
        <div className="spacer-2xl" />
        <div className="page-head">
          <div className="t-label-lg" style={{ color: "var(--c-accent-lo)" }}>Artifacts</div>
          <h1 className="t-h2">{g.title}</h1>
          <div className="spacer-xs" />
          <Link href={`/episodes/${slug}`} className="btn btn--ghost">Go to episode</Link>
        </div>
        <div className="spacer-base" />
        <div className="artifacts__grid">{all.map((src) => <div key={src} className="artifacts__frame"><img src={src} alt="" loading="lazy" /></div>)}</div>
      </main>
      <div className="spacer-2xl" style={{ background: "var(--c-cream)" }} />
      <Footer variant="console" />
    </>
  );
}
