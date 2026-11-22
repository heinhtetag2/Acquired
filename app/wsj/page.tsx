import type { Metadata } from "next";
import articles from "@/content/wsj.json";
import EmailForm from "@/components/EmailForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "The Acquired Column | Acquired Podcast (clone)" };

export default function WsjPage() {
  return (
    <>
      <main id="main" className="page wsj" data-theme="light-fill">
        <div className="spacer-2xl" />
        <div className="page-head">
          <div className="wsj-wordmark" aria-label="The Wall Street Journal">The Wall Street Journal</div>
          <div className="spacer-2xs" />
          <h1 className="t-h1" style={{ lineHeight: 1 }}>The Acquired Column</h1>
          <div className="spacer-4xs" />
          <p className="t-body-140">Ben and David write a column on every new episode. Sign up to receive a gift link to each one.</p>
          <div className="spacer-base" />
          <div className="narrow" style={{ padding: 0 }}><EmailForm id="wsj-email" cta="send me the column" /></div>
        </div>
        <div className="spacer-2xl" />
        <div className="wsj__rule" />
        <div className="spacer-xl" />
        <h2 className="t-h3" style={{ textAlign: "center" }}>All articles</h2>
        <div className="wsj__list">
          {articles.map((a) => (
            <article key={a.href} className="wsj-item">
              <div className="wsj-item__img"><img src={a.image} alt="" loading="lazy" /></div>
              <div className="wsj-item__body">
                <h3 className="t-h3">{a.title}</h3>
                <div className="spacer-3xs" />
                <p className="t-body">{a.dek}</p>
              </div>
              <a className="pl-row__link" href={a.href} target="_blank" rel="noreferrer"><span className="sr-only">{a.title} (opens wsj.com)</span></a>
            </article>
          ))}
        </div>
      </main>
      <div className="spacer-2xl" style={{ background: "var(--c-cream)" }} />
      <Footer variant="console" />
    </>
  );
}
