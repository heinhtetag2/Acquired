import Link from "next/link";
import type { Metadata } from "next";
import { acq2, formatDate, type Acq2Episode } from "@/lib/content";
import Footer from "@/components/Footer";
import { PlayIcon, VideoIcon } from "@/components/Icons";

export const metadata: Metadata = { title: "ACQ2 | Acquired Podcast (clone)" };

function Card({ ep, size }: { ep: Acq2Episode; size: "featured" | "side" | "grid" }) {
  const href = `/acq2-episodes/${ep.slug}`;
  const img = ep.cover && <div className="acq2-media"><img src={ep.cover} alt="" loading={size === "grid" ? "lazy" : undefined} /></div>;
  const text = (
    <div className="acq2-text">
      <Link href={href} className="pl-row__link"><span className="sr-only">{ep.title}</span></Link>
      {size === "featured" ? <h2 className="acq2-title acq2-title--lg">{ep.title}</h2> : <h3 className="acq2-title">{ep.title}</h3>}
      <div className="spacer-xs" />
      <p className={`acq2-desc t-body ${ep.zone === "lp" ? "acq2-desc--lp" : ""}`}>{ep.description}</p>
    </div>
  );
  return (
    <article className={`acq2-item acq2-item--${size}`}>
      <div className="acq2-item__inner">
        <div>
          {size === "featured" ? <>{text}<div className="spacer-sm" />{img}</> : <>{img}{img && <div className={size === "side" ? "spacer-base" : "spacer-sm"} />}{text}</>}
        </div>
        <div>
          <div className={size === "featured" ? "spacer-base" : "spacer-sm"} />
          <div className="acq2-foot">
            <span className="t-label acq2-date">{ep.video && <VideoIcon width={16} height={16} />}{formatDate(ep.date)}</span>
            {ep.zone !== "lp" && <Link href={href} className="acq2-play" aria-label={`Play ${ep.title}`}><PlayIcon /></Link>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Acq2Page() {
  const featured = acq2.filter((e) => e.zone === "featured");
  const side = acq2.filter((e) => e.zone === "side");
  const grid = acq2.filter((e) => e.zone === "grid");
  const lp = acq2.filter((e) => e.zone === "lp");
  return (
    <div className="acq2 theme-dark" data-theme="dark">
      <main id="main" className="acq2__main">
        <h1 className="sr-only">ACQ2</h1>
        <div className="acq2-bar">
          <div className="t-h3">ACQ2 by Acquired</div>
          <p className="t-body-sm" style={{ maxWidth: "var(--w-base)" }}>Ben and David&apos;s interviews with the founders, investors, and operators behind the Acquired universe.</p>
        </div>
        <section className="acq2-frame acq2-discover">
          <div className="acq2-discover__left">{featured.map((e) => <Card key={e.slug} ep={e} size="featured" />)}</div>
          <div className="acq2-discover__right">{side.map((e) => <Card key={e.slug} ep={e} size="side" />)}</div>
        </section>
        <section className="acq2-frame">
          <div className="acq2-grid">{grid.map((e) => <Card key={e.slug} ep={e} size="grid" />)}</div>
        </section>
        <div className="acq2-bar">
          <h2 className="t-h3">Acquired LP Show</h2>
          <p className="t-body-sm" style={{ maxWidth: "var(--w-base)" }}>The vault of VC fundamentals, startup strategy, and early conversations from our LP show.</p>
        </div>
        <section className="acq2-frame">
          <div className="acq2-grid">{lp.map((e) => <Card key={e.slug} ep={e} size="grid" />)}</div>
        </section>
        <div className="spacer-4xl" />
      </main>
      <Footer variant="console-dark" />
    </div>
  );
}
