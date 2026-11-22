"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

/*
  Live testimonial carousel:
  - page size = columns (3, 2 at ≤991, stacked first 3 with no rotation at ≤767); longest quote placed in the middle
  - hold = clamp(words × 200ms, 6000, 13000); out 600ms → hold 120ms → in 600ms
  - runs only while in view and the tab is visible; click left/right half = prev/next; list height locked to tallest page
*/
const MS_PER_WORD = 200, MIN_HOLD = 6000, MAX_HOLD = 13000, FADE_OUT = 600, GAP = 120, FADE_IN = 600;
type T = (typeof site.testimonials)[number];

const colsFor = () => (window.matchMedia("(max-width: 767px)").matches ? 1 : window.matchMedia("(max-width: 991px)").matches ? 2 : 3);
function build(cols: number): T[][] {
  const all = site.testimonials, n = all.length;
  if (cols === 1) return [all.slice(0, 3)];
  const size = Math.min(n, cols), count = Math.ceil(n / size);
  return Array.from({ length: count }, (_, p) => {
    const g = Array.from({ length: size }, (_, k) => all[(p * size + k) % n]);
    if (g.length !== 3) return g;
    const li = g.reduce((m, t, k) => (t.quote.length > g[m].quote.length ? k : m), 0);
    if (li === 1) return g;
    const rest = g.filter((_, k) => k !== li);
    return [rest[0], g[li], rest[1]];
  });
}
const holdFor = (page: T[]) => Math.min(MAX_HOLD, Math.max(MIN_HOLD, page.map((t) => t.quote).join(" ").trim().split(/\s+/).length * MS_PER_WORD));

export default function Testimonials() {
  const [cols, setCols] = useState(3);
  const [pages, setPages] = useState<T[][]>(() => build(3));
  const [cur, setCur] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [height, setHeight] = useState<number>();
  const viewport = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const inView = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const apply = () => { const c = colsFor(); setCols(c); setPages(build(c)); setCur(0); };
    apply();
    let raf = 0; const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (colsFor() !== cols) apply(); }); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lock height to the tallest page (measured via hidden measuring copies)
  useEffect(() => {
    if (cols === 1) { setHeight(undefined); return; }
    const el = viewport.current; if (!el) return;
    const ms = Array.from(el.querySelectorAll<HTMLElement>(".testimonials__measure"));
    setHeight(Math.max(0, ...ms.map((m) => m.offsetHeight)) || undefined);
  }, [pages, cols]);

  const goTo = useCallback((target: number) => {
    if (busy.current || pages.length <= 1) return;
    const next = (target + pages.length) % pages.length;
    busy.current = true; clearTimeout(timer.current);
    setPhase("out");
    setTimeout(() => { setCur(next); requestAnimationFrame(() => setPhase("in")); setTimeout(() => { busy.current = false; }, FADE_IN); }, FADE_OUT + GAP);
  }, [pages.length]);

  // auto-advance
  useEffect(() => {
    if (pages.length <= 1 || cols === 1) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const schedule = () => {
      clearTimeout(timer.current);
      if (reduce || !inView.current || document.hidden) return;
      timer.current = setTimeout(() => goTo(cur + 1), holdFor(pages[cur]) + (phase === "in" ? 0 : FADE_IN));
    };
    const io = new IntersectionObserver(([e]) => { inView.current = e.isIntersecting; schedule(); });
    if (viewport.current) io.observe(viewport.current);
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", schedule); clearTimeout(timer.current); };
  }, [cur, pages, cols, phase, goTo]);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("a, button, input, textarea, select, [role='button']")) return;
    const r = e.currentTarget.getBoundingClientRect();
    goTo(e.clientX - r.left < r.width / 2 ? cur - 1 : cur + 1);
  };

  const page = (p: T[], key: string | number, extra = "") => (
    <div key={key} className={`testimonials__page ${extra}`} style={{ ["--cols" as string]: cols }}>
      {p.map((t, i) => (
        <figure key={t.name + i} className="testimonial" style={{ margin: 0 }}>
          <figcaption>
            <div className="t-label-lg">{t.name}</div>
            <div className="t-label-lg muted">{t.role}</div>
          </figcaption>
          <div className="spacer-xs" />
          <blockquote className="t-body" style={{ margin: 0 }}>{t.quote}</blockquote>
        </figure>
      ))}
    </div>
  );

  return (
    <section className="listeners" aria-labelledby="listeners-h">
      <div className="section-head">
        <h2 id="listeners-h" className="t-h3">Our listeners</h2>
        <div className="spacer-4xs" />
        <p className="t-body-140">Over one million people tune in to every episode.</p>
      </div>
      <div className="spacer-base" />
      <div ref={viewport} className="testimonials" style={{ height }} onClick={onClick} aria-roledescription="carousel" aria-live="polite">
        {pages[cur] && page(pages[cur], "cur", `is-visible ${phase === "in" ? "is-active" : ""}`)}
        {cols > 1 && pages.map((p, i) => page(p, `m${i}`, "testimonials__measure"))}
      </div>
    </section>
  );
}
