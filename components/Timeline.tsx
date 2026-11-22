"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type Item = { image: string; alt: string; date: string; label: string };
// Live constants: CROSSFADE_OUT_S .5 (power2.in), CROSSFADE_IN_S .7 (power2.out), overlap .15, AUTO_INTERVAL_MS 7500, click stage to advance.
const OUT = 0.5, IN = 0.7, OVERLAP = 0.15, AUTO_MS = 7500;

export default function Timeline({ items }: { items: Item[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = (next: number) => {
    const from = refs.current[active], to = refs.current[next];
    if (!from || !to || next === active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf([from, to]);
    if (reduce) { gsap.set(from, { opacity: 0 }); gsap.set(to, { opacity: 1 }); }
    else {
      gsap.to(from, { opacity: 0, duration: OUT, ease: "power2.in" });
      gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: IN, ease: "power2.out", delay: OUT - OVERLAP });
    }
    setActive(next);
  };

  useEffect(() => { refs.current.forEach((el, i) => el && gsap.set(el, { opacity: i === 0 ? 1 : 0 })); }, []);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => go((active + 1) % items.length), AUTO_MS);
    return () => clearInterval(id);
  });

  return (
    <div className="timeline" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <button className="timeline__stage" onClick={() => go((active + 1) % items.length)} aria-label="Next photo">
        {items.map((it, i) => (
          <div key={it.image} ref={(el) => { refs.current[i] = el; }} className={`timeline__item ${i === active ? "is-active" : ""}`} aria-hidden={i !== active}>
            <div className="timeline__media"><img src={it.image} alt={it.alt} loading={i === 0 ? "eager" : "lazy"} decoding="async" /></div>
            <div className="timeline__caption">
              <span className="t-label">{it.date}</span>
              <span className="t-body-sm" style={{ lineHeight: 1 }}>{it.label}</span>
            </div>
          </div>
        ))}
      </button>
    </div>
  );
}
