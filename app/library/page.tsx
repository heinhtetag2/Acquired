import type { Metadata } from "next";
import EmailForm from "@/components/EmailForm";

export const metadata: Metadata = { title: "Library | Acquired Podcast (clone)" };

const PAGES = [1, 2, 3].map((n) => `/images/library/disney-ii-${n}.webp`);

export default function LibraryPage() {
  return (
    <main id="main" className="page page--short" data-theme="light-fill">
      <div className="spacer-2xl" />
      <div className="page-head">
        <h1 className="t-h2">The Acquired Library</h1>
        <div className="spacer-4xs" />
        <p className="t-body-140" style={{ maxWidth: "var(--w-lg)" }}>PDF companions to the episodes, including timelines, diagrams and charts.</p>
        <div className="narrow">
          <div className="spacer-base" />
          <EmailForm id="library-email" cta="View Resources" />
          <div className="spacer-base" />
          <div className="library-pages">{PAGES.map((src) => <div key={src} className="library-page"><img src={src} alt="" /></div>)}</div>
          <div className="spacer-sm" />
          <div className="t-label muted">The Disney II companion</div>
          <div className="spacer-3xs" />
          <p className="t-body-sm muted" style={{ fontSize: "var(--text-sm)", lineHeight: "var(--lh-140)" }}>Disney’s franchises since 1927, cable’s share of profit, acquisitions since 1984, the share count, and parks spending.</p>
          <div className="spacer-2xl" />
        </div>
      </div>
    </main>
  );
}
