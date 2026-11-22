"use client";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { ArrowUpRight } from "./Icons";

const HOLD_MS = 4000;

export default function PressQuotes({ bare }: { bare?: boolean }) {
  const [active, setActive] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches || rm.matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % site.press.length), HOLD_MS);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={`press ${bare ? "press--bare" : ""}`} aria-label="Press">
      <div className="press__row">
        {site.press.map((p, i) => {
          const inner = (
            <>
              <div className="t-body">{p.quote}{p.isLink && <> <ArrowUpRight className="inline-block" /></>}</div>
              <div className="press__logo"><img src={p.logoSrc} alt={p.logoAlt} style={{ maxWidth: p.logoW }} /></div>
            </>
          );
          const cls = `press__block ${i === active ? "is-active" : ""}`;
          return p.href ? <a key={i} href={p.href} target="_blank" rel="noreferrer" className={cls}>{inner}</a> : <div key={i} className={cls}>{inner}</div>;
        })}
      </div>
    </div>
  );
}
