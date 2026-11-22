"use client";
import { useEffect, useRef, useState } from "react";

const GEO = [
  { value: 72, color: "var(--c-teal-100)", ink: true, note: "Primarily English-speaking countries (US, UK, Canada, Australia/NZ)", short: "US, UK, Canada, Australia/NZ", pos: "top" },
  { value: 11, color: "var(--c-teal-300)", ink: true, note: "Rest of Europe", short: "Rest of Europe", pos: "bottom" },
  { value: 10, color: "var(--c-teal-500)", ink: false, note: "Asia", short: "Asia", pos: "top" },
  { value: 7, color: "var(--c-teal-700)", ink: false, note: "Rest of World", short: "Rest of World", pos: "bottom" },
];
const ROLES: [string, number, string][] = [
  ["CEO / President", 14, "var(--c-teal-100)"], ["Engineering", 14, "var(--c-teal-100)"], ["Product", 9, "var(--c-teal-200)"], ["Investor", 9, "var(--c-teal-200)"],
  ["Sales / Business Development", 8, "var(--c-teal-300)"], ["Finance / Accounting", 7, "var(--c-teal-400)"], ["Strategy / Corp Dev", 6, "var(--c-teal-500)"],
  ["Operations", 6, "var(--c-teal-500)"], ["Consulting", 6, "var(--c-teal-600)"], ["Student", 5, "var(--c-teal-700)"], ["Marketing", 4, "var(--c-teal-800)"], ["Other", 12, "var(--c-teal-900)"],
];
const MAX = 14;

/** Bars grow from 24px to their value when scrolled into view (live: IntersectionObserver + width transition), then values/notes fade in. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, set] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { set(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

export function GeoChart() {
  const [ref, on] = useInView<HTMLDivElement>();
  const cols = GEO.map((g) => `${g.value}fr`).join(" ");
  const notes = (pos: string) => (
    <div className="geo-grid" style={{ gridTemplateColumns: cols }}>
      {GEO.map((g) => <div key={g.note} className={`geo-note geo-note--${pos} ${on ? "is-on" : ""}`}>{g.pos === pos && <>{pos === "bottom" && <i />}<span>{g.note}</span>{pos === "top" && <i />}</>}</div>)}
    </div>
  );
  return (
    <div ref={ref} className={`aud-chart ${on ? "is-on" : ""}`} role="img" aria-label="Listener geography: 72% English-speaking countries, 11% rest of Europe, 10% Asia, 7% rest of world">
      {notes("top")}
      <div className="geo-grid" style={{ gridTemplateColumns: cols }}>
        {GEO.map((g) => (
          <div key={g.note} className="aud-bar"><div className="aud-bar__fill" style={{ background: g.color, width: on ? "100%" : undefined, color: g.ink ? "var(--c-teal-1000)" : "var(--c-cream)" }}><span>{g.value}<small>%</small></span></div></div>
        ))}
      </div>
      {notes("bottom")}
      <div className="geo-mobile">
        {GEO.map((g) => (
          <div key={g.note} className="geo-stack">
            <div className="geo-stack__meta"><span>{g.short}</span><span>{g.value}<small>%</small></span></div>
            <div className="geo-stack__track"><div style={{ background: g.color, width: on ? `${g.value}%` : 0 }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoleChart() {
  const [ref, on] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`aud-chart aud-roles ${on ? "is-on" : ""}`}>
      {ROLES.map(([label, v, color], i) => (
        <div key={label} className="aud-row">
          <div className="aud-row__label">{label}</div>
          <div className="aud-bar"><div className="aud-bar__fill" style={{ background: color, width: on ? `${(v / MAX) * 100}%` : undefined, transitionDelay: `${i * 0.04}s`, color: i < 6 ? "var(--c-teal-1000)" : "var(--c-cream)" }}><em className="aud-bar__label-m">{label}</em><span>{v}%</span></div></div>
        </div>
      ))}
    </div>
  );
}
