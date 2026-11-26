"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import EmailForm from "./EmailForm";
import filters from "@/content/filters.json";

/* Scrollbook's footer: the weekly email, the app's pages and the top categories (each opens that Discover deck). */
export const SB_EMAIL = { eyebrow: "Emails from Scrollbook", copy: "One great story a week, plus what's new on Scrollbook." };
const COLUMNS = [
  { heading: "Scrollbook", links: [{ label: "Discover", href: "/" }, { label: "Shelf", href: "/shelf" }, { label: "Library", href: "/library" }, { label: "Your profile", href: "/me" }] },
  { heading: "Categories", links: filters.filter((f) => f.group === "category").slice(0, 4).map((f) => ({ label: f.title, href: `/?c=${f.slug}` })) },
];

// `variant` is accepted for the classic demo pages and ignored: every page gets the Scrollbook footer
export default function Footer(_props: { variant?: string } = {}) {
  const consoleRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  // a soft glow that follows the cursor, only while the footer is on screen
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
    <footer className="footer theme-dark footer--console" data-theme="hidden">
      <div ref={consoleRef} className="footer__console">
        <div ref={blobRef} className="footer__blob" aria-hidden />
        <div className="footer__content">
          <div className="footer__main">
            <div className="footer__newsletter">
              <EmailForm id="footer-email" dark eyebrow={SB_EMAIL.eyebrow} copy={SB_EMAIL.copy} cta="subscribe" />
            </div>
            <div className="footer__rule" aria-hidden />
            <nav className="footer__links" aria-label="Footer">
              {COLUMNS.map((col) => (
                <div key={col.heading} className="footer__col">
                  <div className="t-label footer__col-head">{col.heading}</div>
                  <div className="spacer-sm" />
                  <div className="footer__col-links">
                    {col.links.map((l) => <Link key={l.label} href={l.href} className="footer__link t-label">{l.label}</Link>)}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="footer__bottom t-label">
            <span>© 2026 Scrollbook</span><span>One great story at a time.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
