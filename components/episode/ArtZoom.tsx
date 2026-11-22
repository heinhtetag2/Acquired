"use client";
import { useEffect, useRef, useState } from "react";

// Live: click album art → zooms to 92% of min(vw, vh); in 320ms cubic-bezier(.16,1,.3,1), out 250ms cubic-bezier(.4,0,.2,1).
export default function ArtZoom({ src, alt, color }: { src?: string; alt: string; color: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"in" | "out" | "">("");

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
          srcSet={src.startsWith("/images/art/") && src.endsWith(".webp") ? `${src.replace(".webp", "-450.webp")} 450w, ${src} 900w` : undefined}
          sizes="(max-width: 767px) 100vw, 448px" />}
      </button>
      {open && src && (
        <div className={`zoom ${phase === "in" ? "is-in" : ""}`} onClick={close} role="dialog" aria-label={`${alt} artwork`}>
          <img ref={img} src={src} alt={alt} />
        </div>
      )}
    </>
  );
}
