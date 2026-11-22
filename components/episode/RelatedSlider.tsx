"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EpisodeLite as Episode } from "@/lib/content";
import { ArrowLeft, ArrowRight } from "../Icons";

// Live: native horizontal scroll, arrows call scrollBy({ behavior: 'smooth' }) by one item; progress bar tracks scroll.
export default function RelatedSlider({ episodes }: { episodes: Episode[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ pos: 0, size: 1, atStart: true, atEnd: false });

  useEffect(() => {
    const el = track.current; if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setP({ pos: max ? el.scrollLeft / max : 0, size: el.clientWidth / el.scrollWidth, atStart: el.scrollLeft <= 2, atEnd: el.scrollLeft >= max - 2 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  const step = (dir: number) => {
    const el = track.current; if (!el) return;
    const item = el.querySelector<HTMLElement>(".slider-item");
    el.scrollBy({ left: dir * (item?.offsetWidth ?? 300), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <section className="slider" aria-labelledby="related-h">
      <div className="slider__label"><h2 id="related-h" className="t-label-lg muted">You may also enjoy</h2></div>
      <div className="spacer-2xs" />
      <div ref={track} className="slider__track" tabIndex={0} role="region" aria-label="Related episodes">
        {episodes.map((e) => (
          <Link key={e.slug} href={`/episodes/${e.slug}`} className="slider-item">
            <div className="slider-item__media" style={{ background: e.color }}>{e.cover && <img src={e.cover} alt="" loading="lazy" />}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="slider-item__title">{e.title}</div>
              {e.tagline && <div className="slider-item__sub">{e.tagline}</div>}
            </div>
          </Link>
        ))}
      </div>
      <div className="slider__controls">
        <div className="slider__bar" aria-hidden>
          <div style={{ width: `${p.pos * 100}%` }} />
        </div>
        <div className="slider__arrows">
          <button className="slider-arrow" onClick={() => step(-1)} disabled={p.atStart} aria-label="Previous"><ArrowLeft /></button>
          <button className="slider-arrow" onClick={() => step(1)} disabled={p.atEnd} aria-label="Next"><ArrowRight /></button>
        </div>
      </div>
    </section>
  );
}
