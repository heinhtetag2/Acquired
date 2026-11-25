"use client";
import { useEffect, useRef, useState } from "react";

// Live: click album art → zooms to 92% of min(vw, vh); in 320ms cubic-bezier(.16,1,.3,1), out 250ms cubic-bezier(.4,0,.2,1).
/** `animated`: live album art is an animated GIF; the still paints first (keeps LCP), then the animated WebP swaps in after load. */
/** `motion`: a short silent video that loops over the still (which stays underneath as the poster and for the zoom). */
export default function ArtZoom({ src, alt, color, animated, motion }: { src?: string; alt: string; color: string; animated?: boolean; motion?: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"in" | "out" | "">("");
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    if (!animated || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let idle = 0;
    const start = () => { idle = window.setTimeout(() => setAnim(true), 300); };
    if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
    return () => { window.removeEventListener("load", start); clearTimeout(idle); };
  }, [animated]);
  const v = (s: string, w?: number) => s.replace(".webp", `${anim ? "-anim" : ""}${w ? `-${w}` : anim ? "-900" : ""}.webp`);

  const rect = () => btn.current!.getBoundingClientRect();
  const fitTransform = () => {
    const r = rect(), f = 0.92 * Math.min(window.innerWidth, window.innerHeight);
    const dx = (window.innerWidth - f) / 2 - r.left, dy = (window.innerHeight - f) / 2 - r.top;
    return `translate(${dx}px, ${dy}px) scale(${f / r.width})`;
  };
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!open || !img.current) return;
    const el = img.current, r = rect();
    Object.assign(el.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, transition: "none", transform: "none" });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = reduce() ? "none" : "transform var(--dur-zoom-in) var(--zoom-in-ease)";
      el.style.transform = fitTransform(); setPhase("in");
    }));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onResize = () => { el.style.transition = "none"; el.style.transform = fitTransform(); };
    window.addEventListener("keydown", onKey); window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    const el = img.current; if (!el) return setOpen(false);
    setPhase("out");
    el.style.transition = reduce() ? "none" : "transform var(--dur-zoom-out) cubic-bezier(.4,0,.2,1)";
    el.style.transform = "none";
    setTimeout(() => { setOpen(false); setPhase(""); btn.current?.focus(); }, reduce() ? 0 : 250);
  };

  return (
    <>
      <button ref={btn} className="ep-art" onClick={() => src && setOpen(true)} aria-label={`Enlarge ${alt} artwork`} style={{ background: color }}>
        {src && <img src={src} alt={alt} fetchPriority="high"
          srcSet={src.startsWith("/images/art/") && src.endsWith(".webp") ? `${v(src, 450)} 450w, ${v(src, 700)} 700w, ${v(src)} 900w` : undefined}
          sizes="(max-width: 767px) 100vw, 448px" />}
        {motion && <video className="ep-art__motion" src={motion} poster={src} autoPlay muted loop playsInline preload="auto" aria-hidden />}
      </button>
      {open && src && (
        <div className={`zoom ${phase === "in" ? "is-in" : ""}`} onClick={close} role="dialog" aria-label={`${alt} artwork`}>
          <img ref={img} src={anim ? v(src) : src} alt={alt} />
        </div>
      )}
    </>
  );
}
