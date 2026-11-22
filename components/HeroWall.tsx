"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { EpisodeLite as Episode } from "@/lib/content";
import { ArrowDown } from "./Icons";
import { cssNum } from "@/lib/motion";
import HeroVinyl, { type HeroVinylHandle } from "./HeroVinyl";

// Positions + fade windows copied verbatim from the live hero script (acqHeroLayout V8).
const DESKTOP_VISIBLE: [number, number][] = [
  [2, 3], [2, 4], [3, 4], [3, 3], [3, 2], [2, 2], [1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [3, 5], [3, 1], [2, 1], [1, 1], [1, 6], [2, 6], [3, 6],
];
const DESKTOP_STAGGER: [number, number][] = [[3, 1], [3, 6], [3, 2], [3, 5], [3, 3], [3, 4], [2, 1], [2, 6], [2, 2], [2, 5], [2, 3], [2, 4], [1, 1], [1, 6], [1, 2], [1, 5], [1, 3], [1, 4]];
const DESKTOP_TIMINGS: [number, number][] = [
  [0.0, 0.27], [0.03, 0.3], [0.06, 0.33], [0.09, 0.36], [0.12, 0.39], [0.15, 0.42],
  [0.14, 0.41], [0.17, 0.44], [0.2, 0.47], [0.23, 0.5], [0.26, 0.53], [0.29, 0.56],
  [0.28, 0.55], [0.31, 0.58], [0.34, 0.61], [0.37, 0.64], [0.4, 0.67], [0.43, 0.7],
];
const MOBILE_VISIBLE: [number, number][] = [[2, 2], [2, 3], [3, 3], [3, 2], [1, 2], [1, 3], [4, 2], [4, 3], [2, 1], [2, 4], [3, 1], [3, 4], [1, 1], [1, 4], [4, 1], [4, 4]];
const MOBILE_STAGGER: [number, number][] = [[4, 1], [4, 4], [4, 2], [4, 3], [3, 1], [3, 4], [3, 2], [3, 3], [2, 1], [2, 4], [2, 2], [2, 3], [1, 1], [1, 4], [1, 2], [1, 3]];
const MOBILE_TIMINGS: [number, number][] = [
  [0.0, 0.28], [0.03, 0.31], [0.06, 0.34], [0.09, 0.37], [0.11, 0.39], [0.14, 0.42], [0.17, 0.45], [0.2, 0.48],
  [0.22, 0.5], [0.25, 0.53], [0.28, 0.56], [0.31, 0.59], [0.33, 0.61], [0.36, 0.64], [0.39, 0.67], [0.42, 0.7],
];
const CTA_FADE_END = 0.1;
const SCRIM_FADE_END = 0.14;
const k = (r: number, c: number) => `${r}:${c}`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => 1 - t * t * (3 - 2 * t);

// Live "prewarm": record images load the first time the grid is hovered/focused, so they never compete with the covers.
const warmRecords = (root: HTMLElement) => root.querySelectorAll<HTMLImageElement>("img[data-src]").forEach((i) => { i.src = i.dataset.src!; i.removeAttribute("data-src"); });

export default function HeroWall({ episodes }: { episodes: Episode[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const vinylRef = useRef<HeroVinylHandle>(null);
  const washRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current!, scrim = scrimRef.current!, cta = ctaRef.current!;
    const items = Array.from(grid.children) as HTMLElement[];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    let staggerItems: HTMLElement[] = [];
    let timings: [number, number][] = [];
    let intro = true;
    const reveal = { cta: 1, scrim: 1, on: false };

    const layout = () => {
      const positions = desktop.matches ? DESKTOP_VISIBLE : MOBILE_VISIBLE;
      const map = new Map<string, HTMLElement>();
      items.forEach((item, i) => {
        const pos = positions[i];
        if (!pos) { item.style.display = "none"; return; }
        item.style.display = "";
        item.style.gridRow = String(pos[0]);
        item.style.gridColumn = String(pos[1]);
        map.set(k(pos[0], pos[1]), item);
      });
      staggerItems = (desktop.matches ? DESKTOP_STAGGER : MOBILE_STAGGER).map(([r, c]) => map.get(k(r, c))!).filter(Boolean);
      timings = desktop.matches ? DESKTOP_TIMINGS : MOBILE_TIMINGS;
    };

    const progress = () => {
      if (window.scrollY <= 1) return 0;
      const h = window.innerHeight;
      // hero is fixed (top 0, bottom = h); next section starts at h in document flow
      const nextTop = h - window.scrollY;
      return clamp01((h - nextTop) / h);
    };

    const paint = () => {
      if (intro) return;
      const p = progress();
      cta.style.opacity = String(reveal.cta * (1 - clamp01(p / CTA_FADE_END)));
      scrim.style.opacity = String(reveal.scrim * (1 - clamp01(p / SCRIM_FADE_END)));
      cta.style.pointerEvents = Number(cta.style.opacity) <= 0.01 ? "none" : "";
      staggerItems.forEach((item, i) => {
        const [a, b] = timings[i] ?? [0, 1];
        const o = reduce.matches ? 1 - clamp01(p / 0.6) : p <= a ? 1 : p >= b ? 0 : smooth((p - a) / (b - a));
        item.style.opacity = String(Math.round(o * 1000) / 1000);
        item.style.pointerEvents = o <= 0.02 ? "none" : "";
      });
    };

    layout();
    const onScroll = () => requestAnimationFrame(paint);
    const onResize = () => { layout(); paint(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const settle = (withReveal: boolean) => {
      intro = false;
      document.documentElement.classList.remove("acq-home-intro");
      document.documentElement.style.overflow = "";
      if (!withReveal) { paint(); return; }
      Object.assign(reveal, { cta: 0, scrim: 0.3, on: true });
      gsap.timeline({ onUpdate: paint, onComplete: () => { reveal.on = false; paint(); } })
        .to(reveal, { scrim: 1, duration: 1.6, ease: "sine.inOut" }, 0)
        .to(reveal, { cta: 1, duration: 1.1, ease: "sine.inOut" }, 0.5);
    };

    // Intro: only at top of page, not with reduced motion. Order = top-down, inner columns first.
    let guard: ReturnType<typeof setTimeout> | undefined;
    if (reduce.matches || window.scrollY > 4 || document.hidden) {
      settle(false);
    } else {
      document.documentElement.classList.add("acq-home-intro");
      document.documentElement.style.overflow = "hidden";
      const visible = items.filter((i) => i.style.display !== "none");
      const cols = desktop.matches ? 6 : 4;
      const mid = (cols + 1) / 2;
      const sorted = visible.slice().sort((A, B) => {
        const ra = +A.style.gridRow, rb = +B.style.gridRow;
        if (ra !== rb) return ra - rb;
        return Math.abs(+A.style.gridColumn - mid) - Math.abs(+B.style.gridColumn - mid);
      });
      const dur = cssNum("--gsap-intro-dur", 0.7), stagger = cssNum("--gsap-intro-stagger", 0.055);
      gsap.set(sorted, { opacity: 0, scale: 0.96 });
      gsap.set([scrim, cta], { opacity: 0 });
      gsap.to(sorted, { opacity: 1, scale: 1, duration: dur, ease: "power2.out", stagger, clearProps: "transform" });
      const total = (sorted.length - 1) * stagger + dur;
      gsap.delayedCall(total, () => { clearTimeout(guard); window.scrollTo(0, 0); settle(true); });
      // ANIM_GUARD_MS (live: 2500) — GSAP's ticker stops in hidden tabs; never leave the wall invisible.
      guard = setTimeout(() => {
        if (!intro) return;
        gsap.killTweensOf(sorted); gsap.set(sorted, { opacity: 1, clearProps: "transform" });
        settle(false);
      }, total * 1000 + 2500);
    }

    return () => {
      clearTimeout(guard);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.documentElement.style.overflow = "";
      gsap.killTweensOf(items);
    };
  }, []);

  const onExplore = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("intro-section");
    if (!target) return;
    target.focus({ preventScroll: true });
    const to = target.getBoundingClientRect().top + window.scrollY;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return window.scrollTo(0, to);
    const proxy = { y: window.scrollY };
    gsap.to(proxy, { y: to, duration: cssNum("--gsap-scroll-cta-dur", 1.6), ease: "power2.inOut", onUpdate: () => window.scrollTo(0, proxy.y) });
  };

  return (
    <div ref={sectionRef} className="hero-section" aria-label="Featured episodes">
      <div className="hero">
        <div ref={washRef} className="hero-vinyl__wash" aria-hidden />
        <div ref={scrimRef} className="hero__scrim" aria-hidden />
        <div className="hero__wrap">
          <div ref={gridRef} className="hero__grid" onPointerEnter={(e) => warmRecords(e.currentTarget)} onFocus={(e) => warmRecords(e.currentTarget)}>
            {episodes.map((ep) => (
              <div key={ep.slug} className="hero__item" style={{ ["--rec" as string]: ep.color }}>
                <div className="hero__record" aria-hidden>{ep.vinyl && <img data-src={ep.vinyl} alt="" />}</div>
                <div className="hero__cover" style={{ background: ep.color }}>
                  {ep.cover ? <img src={ep.cover} alt="" decoding="async" /> : <div className="hero__cover-art" aria-hidden>{ep.title}</div>}
                  <Link href={`/episodes/${ep.slug}`} className="hero__open" onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || !ep.vinyl || document.documentElement.classList.contains("acq-home-intro")) return;
                    e.preventDefault(); vinylRef.current?.open(ep, e.currentTarget.parentElement as HTMLElement);
                  }}><span className="sr-only">{ep.title}</span></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        <HeroVinyl ref={vinylRef} grid={gridRef} scrim={scrimRef} cta={ctaRef} wash={washRef} />
        <a ref={ctaRef} href="#intro-section" className="btn hero__cta" onClick={onExplore}>
          Explore Acquired <ArrowDown />
        </a>
      </div>
    </div>
  );
}
