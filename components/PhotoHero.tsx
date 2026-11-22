import Link from "next/link";
import DriftImage from "./DriftImage";

export default function PhotoHero() {
  return (
    <section className="photo-hero" id="intro-section" tabIndex={-1} style={{ outline: "none" }}>
      <div className="photo-hero__module" data-theme="light-fill">
        <DriftImage className="photo-hero__media" data-theme="dark" src="/images/about-ben-david.webp" alt="Ben and David">
          <div className="photo-hero__scrim" aria-hidden />
        </DriftImage>
        <div className="photo-hero__content">
          <div className="photo-hero__copy">
            <a href="https://link.acquired.fm/sierra" className="sierra" target="_blank" rel="noreferrer">
              <small>Presented by</small>
              <span>✳ Sierra</span>
            </a>
            <div className="spacer-sm" />
            <h1 className="t-h1">Every company<br />has a story</h1>
            <div className="spacer-2xs" />
            <p className="t-body">Acquired tells the definitive history &amp; strategy of the world’s greatest companies.</p>
            <div className="spacer-sm" />
            <Link href="/about" className="btn btn--cream">About Acquired</Link>
            <div className="spacer-lg photo-credit--desktop" />
            <div className="t-label-xs photo-credit photo-credit--desktop">Photograph: Cayce Clifford, New York Times.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
