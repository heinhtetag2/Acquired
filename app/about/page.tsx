import Link from "next/link";
import type { Metadata } from "next";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import { GeoChart, RoleChart } from "@/components/AudienceCharts";
import AboutHeroCta from "@/components/AboutHeroCta";
import { ArrowRight } from "@/components/Icons";

export const metadata: Metadata = { title: "About | Acquired Podcast (clone)" };

const STATS = [
  { n: 76, label: "Tech, finance & investing", copy: "The decision-makers in high-growth industries." },
  { n: 71, label: "Founders & aspiring founders", copy: "20% current founders, 11% former founders, and 40% aspiring founders." },
  { n: 35, label: "C-level or VP-level executives", copy: "Including 14% active CEOs today." },
];
const PARTNERS = ["Sierra", "Anthropic", "WorkOS", "Sentry", "Shopify", "ServiceNow", "J.P.Morgan", "Vanta", "Vercel", "Plaid", "Crusoe", "Huntress"];
const HOSTS = [
  { name: "Ben Gilbert", img: "/images/about/ben.webp", x: "https://x.com/gilbert", li: "https://www.linkedin.com/in/benjamingilbert/",
    bio: "Sample bio: Ben is the co-founder and co-host of Acquired. Before the show he worked as a software engineer and later as a venture capitalist. He also spent time at a large software company and at early-stage investment firms, and he enjoys building things in his spare time. Replace this placeholder with the real biography in app/about/page.tsx — the original runs to about seven lines at this width." },
  { name: "David Rosenthal", img: "/images/about/david.webp", x: "https://x.com/djrosent", li: "https://www.linkedin.com/in/davidjamesrosenthal/",
    bio: "Sample bio: David is the co-founder and co-host of Acquired. He also spent years in venture capital before turning the show into a full-time job. He studied history and business, worked in finance and venture, and has a deep interest in how great companies get built over decades. Replace this placeholder with the real biography in app/about/page.tsx — the original runs to about eight lines at this width, a little longer than Ben’s, so this sentence adds one more line to match." },
];

export default function AboutPage() {
  return (
    <>
      <div className="about-hero-section" data-theme="dark">
        <div className="about-hero theme-dark">
          <picture>
            <source media="(max-width: 767px)" srcSet="/images/about/hero-mobile.webp" />
            <img src="/images/about/hero.webp" alt="Ben and David" />
          </picture>
          <div className="about-hero__scrim" aria-hidden />
          <div className="about-hero__content">
            <h1 className="about-hero__title">About Acquired</h1>
            <div className="spacer-2xs" />
            <p className="t-body">10 years. 220 episodes. Over a million listeners.</p>
            <div className="spacer-sm" />
            <AboutHeroCta />
            <div className="spacer-lg" />
            <div className="t-label-xs photo-credit">Photograph courtesy Rockefeller Center</div>
          </div>
        </div>
      </div>

      <main id="main" className="about-main">
        <section id="about-story" className="about-story" tabIndex={-1} data-theme="light-fill">
          <div className="page-head">
            <h2 className="t-h2" style={{ maxWidth: "var(--about-h2-w)" }}>Acquired tells the stories and strategies of the world’s greatest companies</h2>
          </div>
          <div className="spacer-base" />
          <p className="about-lede">Each episode is a four-hour deep dive into a single company’s history from its founding until today.</p>
          <p className="t-body">Sample copy: Ben and David handcraft each episode from hundreds of hours of research and production — primary sources, financial documents and many conversations with the people who lived each company’s story — then piece it together into one narrative that holds the whole arc of the company. Replace with the real copy.</p>
          <p className="t-body">Sample copy: the question behind every episode is the same — why did this company work so spectacularly, when so many others failed?</p>
          <p className="t-body">Occasionally the people who built those companies join us to help answer that question, such as <Link href="/episodes/jensen-huang">Jensen Huang</Link>, <Link href="/episodes/charlie-munger">Charlie Munger</Link>, <Link href="/episodes/starbucks-with-howard-schultz">Howard Schultz</Link>, <Link href="/episodes/the-mark-zuckerberg-interview">Mark Zuckerberg</Link>, <Link href="/episodes/spotify-ceo-daniel-ek">Daniel Ek</Link>, <Link href="/episodes/tsmc-founder-morris-chang">Morris Chang</Link>, and <Link href="/episodes/the-jamie-dimon-interview">Jamie Dimon.</Link></p>
          <p className="t-body">Sample copy: the result is something unusual — a carefully produced strategy deep-dive wrapped in a story, which leaders share with their teams and investors use when they research a company. Replace with the real copy.</p>
          <p className="t-body">Sample copy: episodes are evergreen. They focus on history and fundamentals rather than the news of the day, so an episode should be just as useful five, ten or even twenty years from now as it is today. Replace with the real copy.</p>
          <figure className="about-photo">
            <div className="timeline__media"><img src="/images/about/nvidia.webp" alt="Ben and David at NVIDIA GTC" loading="lazy" decoding="async" /></div>
            <figcaption className="timeline__caption"><span className="t-label">May 2025</span><span className="t-body-sm" style={{ lineHeight: 1 }}>Ben &amp; David at NVIDIA GTC</span></figcaption>
          </figure>
          <div className="about-rule" />
          <p className="t-body"><em>We hope you enjoy the show as much as we love making it. It is our passion, and our mark on the world.</em></p>
          <div className="about-sign">
            {["Ben Gilbert", "David Rosenthal"].map((n) => (
              <div key={n} className="about-sign__item"><div className="about-sign__script" aria-hidden>{n.split(" ")[0]}</div><div className="t-label-lg">{n}</div></div>
            ))}
          </div>
        </section>

        <div className="spacer-4xl" />
        <section className="about-hosts" aria-labelledby="hosts-h">
          <h2 id="hosts-h" className="t-h3" style={{ textAlign: "center" }}>Meet the hosts</h2>
          <div className="spacer-lg" />
          <div className="about-hosts__grid">
            {HOSTS.map((h) => (
              <div key={h.name} className="host">
                <div className="host-card">
                  <img src={h.img} alt={`${h.name}, Acquired Host`} loading="lazy" decoding="async" />
                  <div className="host-card__content">
                    <div className="host-card__name">{h.name}</div>
                    <div className="host-card__links">
                      <a className="host-icon" href={h.x} target="_blank" rel="noreferrer" aria-label={`${h.name} on X`}>X</a>
                      <a className="host-icon" href={h.li} target="_blank" rel="noreferrer" aria-label={`${h.name} on LinkedIn`}>in</a>
                    </div>
                  </div>
                </div>
                <p className="t-body">{h.bio}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="spacer-4xl" />
        <Testimonials />
        <div className="spacer-4xl" />

        <section className="about-audience theme-dark" data-theme="dark" aria-labelledby="aud-h">
          <div className="spacer-4xl" />
          <div className="page-head" style={{ padding: "0 var(--space-lg)" }}>
            <h2 id="aud-h" className="t-h2">The Audience</h2>
            <div className="spacer-4xs" />
            <p className="t-body-140" style={{ maxWidth: "var(--w-lg)" }}>Acquired is the #1 technology podcast on Apple and Spotify. Each episode reaches over 1 million listeners.</p>
          </div>
          <div className="spacer-xl" />
          <div className="aud-stats">
            {STATS.map((s) => (
              <div key={s.label} className="aud-stat">
                <div className="aud-stat__n"><span>{s.n}</span>%</div>
                <div className="aud-stat__label">{s.label}</div>
                <p className="t-body" style={{ color: "var(--c-cream-60)" }}>{s.copy}</p>
              </div>
            ))}
          </div>
          <div className="spacer-3xl" />
          <div className="aud-wrap"><GeoChart /></div>
          <div className="spacer-3xl" />
          <div className="aud-wrap aud-wrap--narrow"><RoleChart /></div>
          <div className="spacer-3xl" />
          <div className="spacer-3xl" />
          <div className="page-head">
            <div className="t-label-lg" style={{ color: "var(--c-cream-60)" }}>Made possible by our partners.</div>
            <div className="spacer-xl" />
            <div className="partners">{PARTNERS.map((p) => <a key={p} href="#" className="partner">{p}</a>)}</div>
            <div className="spacer-2xl" />
            <p className="t-body">Interested in partnering with Acquired?</p>
            <div className="spacer-sm" />
            <Link href="/sponsor" className="btn btn--outline-light">sponsorships <ArrowRight width={16} height={16} /></Link>
          </div>
          <div className="spacer-4xl" />
        </section>
      </main>
      <a href="https://acquired.fm/store" className="about-vinyl" aria-label="Acquired soundtrack vinyl"><img src="/images/about/vinyl.png" alt="" loading="lazy" /></a>
      <Footer />
    </>
  );
}
