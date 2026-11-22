import Link from "next/link";
import type { Metadata } from "next";
import PressQuotes from "@/components/PressQuotes";
import Testimonials from "@/components/Testimonials";
import Timeline from "@/components/Timeline";
import Footer from "@/components/Footer";
import { ArrowUpRight } from "@/components/Icons";

export const metadata: Metadata = { title: "Press | Acquired Podcast (clone)" };

const TIMELINE = [
  { image: "/images/press-timeline/2025-radio-city.webp", alt: "2025 Radio City", date: "July 2025", label: "Acquired Live at Radio City" },
  { image: "/images/press-timeline/2025-nvidia-gtc.webp", alt: "Ben and David", date: "March 2025", label: "Live at NVIDIA GTC with Acquired" },
  { image: "/images/press-timeline/2024-chase-center.webp", alt: "Ben and David", date: "September 2024", label: "Acquired Live at the Chase Center" },
];

const MediaKit = () => (
  <Link href="/media-kit" className="btn btn--dark btn--lg">Media Kit <ArrowUpRight width={18} height={18} /></Link>
);

export default function PressPage() {
  return (
    <>
      <main id="main" className="page press-page" data-theme="light-fill">
        <section className="page-head press-page__hero">
          <div className="spacer-2xl" />
          <div className="t-label-lg muted">Acquired Media Kit</div>
          <div className="spacer-xs" />
          <h1 className="t-h2" style={{ maxWidth: "var(--w-base)" }}>Deep dives on the world&apos;s greatest companies</h1>
          <div className="spacer-4xs" />
          <p className="t-body-140" style={{ maxWidth: "var(--w-lg)" }}>Sample copy: every episode runs four hours or more, takes hundreds of hours to research, and comes out roughly eight times a year. Hosted by Ben Gilbert and David Rosenthal.</p>
          <div className="spacer-lg" />
          <MediaKit />
          <div className="spacer-3xl" />
        </section>
        <PressQuotes bare />
        <div className="spacer-4xl" />
        <section className="press-article">
          <div className="page-head">
            <div className="t-label-lg muted">About the show</div>
            <div className="spacer-xs" />
            <h2 className="t-h2">Acquired makes the deepest business content on the internet</h2>
          </div>
          <Timeline items={TIMELINE} />
          <p className="t-body">Sample copy: Acquired is a podcast hosted by Ben Gilbert and David Rosenthal. Each episode follows a single company from the very beginning to today, and tells the full story of why it worked so well — and why so many others didn’t.</p>
          <p className="t-body">Sample copy: every episode takes hundreds of hours of research across primary sources, financial filings and original interviews. Listeners often describe the format as a conversational audiobook.</p>
          <p className="t-body">The people who built those companies sometimes join the show, such as the founders/CEOs of <Link href="/episodes/jensen-huang">NVIDIA</Link>, <Link href="/episodes/charlie-munger">Berkshire Hathaway</Link>, <Link href="/episodes/starbucks-with-howard-schultz">Starbucks</Link>, <Link href="/episodes/the-mark-zuckerberg-interview">Meta</Link>, <Link href="/episodes/spotify-ceo-daniel-ek">Spotify</Link>, <Link href="/episodes/tsmc-founder-morris-chang">TSMC</Link>, and <Link href="/episodes/the-jamie-dimon-interview">J.P. Morgan.</Link></p>
          <blockquote className="text-callout">“Placeholder press quote of a similar length to the original — paste the real wording into app/press/page.tsx.”<br />— Wall Street Journal</blockquote>
          <p className="t-body">For press inquiries, reach us at <a href="mailto:hello@acquired.fm">hello@acquired.fm</a></p>
          <div style={{ display: "flex", justifyContent: "center" }}><MediaKit /></div>
        </section>
        <div className="spacer-4xl" />
        <Testimonials />
        <div className="spacer-4xl" />
      </main>
      <Footer variant="console" />
    </>
  );
}
