"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { site } from "@/lib/site";
import { ArrowUpRight } from "./Icons";
import EmailForm from "./EmailForm";
import DriftImage from "./DriftImage";

export default function Footer({ variant = "combo" }: { variant?: "combo" | "console" | "console-dark" }) {
  const consoleRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  // Cursor-following glow, only while the console is on screen (live: IntersectionObserver + rAF).
  useEffect(() => {
    const el = consoleRef.current, blob = blobRef.current;
    if (!el || !blob || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0, visible = false;
    const loop = () => { x += (tx - x) * 0.12; y += (ty - y) * 0.12; blob.style.transform = `translate(${x}px, ${y}px)`; if (visible) raf = requestAnimationFrame(loop); };
    const onMove = (e: PointerEvent) => { const r = el.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(loop); });
    const r = el.getBoundingClientRect(); tx = x = r.width * 0.3; ty = y = r.height * 0.5;
    io.observe(el); el.addEventListener("pointermove", onMove);
    return () => { io.disconnect(); el.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <footer className={`footer theme-dark ${variant === "console" ? "footer--console" : variant === "console-dark" ? "footer--console-dark" : ""}`} data-theme="hidden">
      {variant === "combo" && <>
      <div className="footer__bg" aria-hidden />
      <DriftImage className="footer__photo" aria-hidden src="/images/footer.webp" alt="" fade />
      <div className="footer__cta">
        <div className="t-label-lg" style={{ marginBottom: "var(--space-3xs)" }}>The Acquired Community</div>
        <h2>Still thinking about an episode?</h2>
        <div className="spacer-xs" />
        <div style={{ maxWidth: "var(--w-base)" }}>
          <p className="t-body-140">Discuss the episode with other listeners and receive updates from Acquired.</p>
          <div className="spacer-base" />
          <Link href="/slack" className="btn btn--cream btn--lg">Join our Slack</Link>
        </div>
      </div>
      </>}
      <div ref={consoleRef} className="footer__console">
        <div ref={blobRef} className="footer__blob" aria-hidden />
        <div className="footer__content">
          <div className="footer__main">
            <div className="footer__newsletter">
              <EmailForm id="footer-email" dark eyebrow="Emails from Ben & David" copy="Our key takeaways, research photos, hints at the next episode, and your vote on future topics." cta="subscribe" />
            </div>
            <div className="footer__rule" aria-hidden />
            <nav className="footer__links" aria-label="Footer">
              {site.footer.map((col) => (
                <div key={col.heading} className="footer__col">
                  <div className="t-label footer__col-head">{col.heading}</div>
                  <div className="spacer-sm" />
                  <div className="footer__col-links">
                    {col.links.map((l) => {
                      const ext = "external" in l && l.external;
                      const cls = "footer__link t-label";
                      const body = <>{l.label}{ext && <ArrowUpRight />}</>;
                      return l.href.startsWith("/") ? <Link key={l.label} href={l.href} className={cls}>{body}</Link>
                        : <a key={l.label} href={l.href} className={cls} target={l.href.startsWith("mailto") ? undefined : "_blank"} rel="noreferrer">{body}</a>;
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="footer__bottom t-label">
            <span>© 2026 ACQ, LLC</span><span>Every company has a story.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
