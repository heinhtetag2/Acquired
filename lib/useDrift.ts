"use client";
import { useEffect } from "react";

/*
  Port of the live site's image "drift" (inline script: MAX_ZOOM 1.2, FADE [.2, .5]).
  The image is made T px taller than its frame and translated from -T/2 → +T/2 while the frame
  travels through the viewport (eased in/out over R px). Optional fade maps the same progress to opacity.
*/
const MAX_ZOOM = 1.2;

export function useDrift(img: React.RefObject<HTMLImageElement | null>, frame: React.RefObject<HTMLElement | null>, fade?: [number, number]) {
  useEffect(() => {
    const el = img.current, fr = frame.current;
    if (!el || !fr) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phone = window.matchMedia("(max-width: 767px)");
    let fw = 0, fh = 0, vh = 0, a = 0, b = 0, R = 0, T = 0, last: number | null = null, lastO: number | null = null;

    const measure = (r: DOMRect) => {
      const lag = still.matches || phone.matches ? 0 : 0.1;
      const iw = el.naturalWidth || 1920, ih = el.naturalHeight || 1440;
      const coverH = Math.max(fh, (fw * ih) / iw);
      if (vh - fh >= fh * 0.5) { a = fh; b = vh; R = Math.min(fh * 0.25, (b - a) / 2); }
      else { a = 0; b = vh + fh; R = 0; }
      const sMax = vh - (r.top + window.scrollY - (document.documentElement.scrollHeight - vh));
      if (sMax < b && sMax > a + 1) { b = sMax; R = Math.min(R, (b - a) / 2); }
      T = Math.max(0, Math.min(lag * (b - a), coverH * MAX_ZOOM - fh));
      el.style.top = `${-T / 2 - 1}px`;
      el.style.height = `${fh + T + 2}px`;
      last = null;
    };
    const travelled = (s: number) => {
      if (R <= 0) return Math.min(Math.max(s - a, 0), b - a);
      if (s <= a - R) return 0;
      if (s < a + R) { const d = s - (a - R); return (d * d) / (4 * R); }
      if (s < b - R) return s - a;
      if (s < b + R) { const e = b + R - s; return b - a - (e * e) / (4 * R); }
      return b - a;
    };
    const update = () => {
      const r = fr.getBoundingClientRect();
      if (!r.width) return;
      const h = window.innerHeight;
      if (r.width !== fw || r.height !== fh || h !== vh) { fw = r.width; fh = r.height; vh = h; measure(r); }
      if (r.bottom < -50 || r.top > vh + 50 || !(b > a)) return;
      const k = travelled(vh - r.top) / (b - a);
      if (fade) {
        const o = Math.round((fade[0] + (fade[1] - fade[0]) * k) * 1000) / 1000;
        if (o !== lastO) { lastO = o; fr.style.opacity = String(o); }
      }
      const y = Math.round((k * T - T / 2) * 10) / 10;
      if (y === last) return;
      last = y;
      el.style.transform = `translate3d(0,${y}px,0)`;
    };
    let ticking = false;
    const kick = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); };
    const onLoad = () => { fw = 0; update(); };
    el.addEventListener("load", onLoad);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();
    return () => { el.removeEventListener("load", onLoad); window.removeEventListener("scroll", kick); window.removeEventListener("resize", kick); };
  }, [img, frame, fade]);
}
