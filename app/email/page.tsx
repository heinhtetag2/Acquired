import type { Metadata } from "next";
import EmailForm from "@/components/EmailForm";
import { ArrowUpRight } from "@/components/Icons";

export const metadata: Metadata = { title: "Emails from Ben & David | Acquired Podcast (clone)" };

export default function EmailPage() {
  return (
    <main id="main" className="page page--short" data-theme="light-fill">
      <div className="page-head">
        <div className="narrow">
          <div className="spacer-base" />
          <h1 className="t-h2">Emails From <span style={{ whiteSpace: "nowrap" }}>Ben &amp; David</span></h1>
          <div className="spacer-4xs" />
          <EmailForm id="email-page" copy="Our key takeaways, research photos, hints at the next episode, and your vote on future topics." cta="subscribe" gap="base" />
          <div className="spacer-base" />
          <figure className="email-preview">
            <div className="email-preview__img">
              <img src="/images/email-preview.webp" alt="Seinfeld email preview" />
              <a className="btn btn--cream email-preview__btn" href="https://link.acquired.fm/seinfeld-email" target="_blank" rel="noreferrer">View Email <ArrowUpRight width={14} height={14} /></a>
            </div>
            <figcaption className="t-body-xs muted">The original pilot, aired in 1989 as <em>The Seinfeld Chronicles</em>.</figcaption>
          </figure>
          <div className="spacer-base" />
        </div>
      </div>
    </main>
  );
}
