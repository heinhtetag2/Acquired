"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import gsap from "gsap";
import type { EpisodeLite as Episode } from "@/lib/content";
import { ArrowLeft } from "./Icons";

/*
  Live constants (AcqScroll hero script):
  CAMERA_MS 800 power3.out (mobile 620), CAMERA scale 1.05–2.75, VINYL_TO_COVER_RATIO .93, MORPH_START_AT .65,
  MORPH_IN_MS 620 / MORPH_OUT_MS 600, OPEN_ENV wash 1s power2.out + scrim→0 (.6s sine.inOut, delay .45),
  CLOSE_ENV wash→0 1.1s sine.inOut + scrim→1 (.5s power2.out), EPISODE_EXIT delay 400 / move 300 power3.inOut,
  --vinyl-size clamp(448px, 60vh, 640px), --vinyl-spin-duration 2.8s.
*/
const CAMERA = 0.8, CAMERA_MOBILE = 0.62, MORPH_IN = 0.62, MORPH_OUT = 0.6, MORPH_AT = 0.65, RATIO = 0.93;

export type HeroVinylHandle = { open: (ep: Episode, card: HTMLElement) => void; isOpen: () => boolean };
type Props = { grid: React.RefObject<HTMLDivElement | null>; scrim: React.RefObject<HTMLDivElement | null>; cta: React.RefObject<HTMLAnchorElement | null>; wash: React.RefObject<HTMLDivElement | null> };

const HeroVinyl = forwardRef<HeroVinylHandle, Props>(function HeroVinyl({ grid, scrim, cta, wash }, ref) {
  const router = useRouter();
  const [ep, setEp] = useState<Episode | null>(null);
  const [playing, setPlaying] = useState(false);
  const vinyl = useRef<HTMLImageElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const state = useRef<{ card: HTMLElement | null; busy: boolean; open: boolean }>({ card: null, busy: false, open: false });
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => window.matchMedia("(max-width: 767px)").matches;

  const rectOf = (el: Element) => el.getBoundingClientRect();

  const open = useCallback((episode: Episode, card: HTMLElement) => {
    const s = state.current; if (s.busy || s.open || !grid.current) return;
    s.busy = true; s.card = card; setEp(episode);
    document.documentElement.classList.add("hero-is-active");
    window.dispatchEvent(new CustomEvent("acq:navtheme", { detail: "episode" }));
    {
      const g = grid.current!, v = vinyl.current!, w = wash.current!, c = copy.current!, sl = slot.current!;
      const d = reduce() ? 0 : 1;
      const cardRect = rectOf(card), gridRect = rectOf(g);
      const vw = window.innerWidth, vh = window.innerHeight;
      const vinylSize = rectOf(sl).width;
      const S = Math.min(2.75, Math.max(1.05, vinylSize / RATIO / cardRect.width));
      // card centre in untransformed grid coordinates → centre of viewport
      const cx = cardRect.left - gridRect.left + cardRect.width / 2, cy = cardRect.top - gridRect.top + cardRect.height / 2;
      const tx = vw / 2 - gridRect.left - cx * S, ty = vh / 2 - gridRect.top - cy * S;
      const cam = mobile() ? CAMERA_MOBILE : CAMERA;
      const others = Array.from(g.querySelectorAll<HTMLElement>(".hero__item")).filter((el) => el !== card.closest(".hero__item"));
      const tl = gsap.timeline({ onComplete: () => { s.busy = false; s.open = true; c.querySelector<HTMLElement>(".hero-vinyl__back")?.focus({ preventScroll: true }); } });
      tl.to(w, { opacity: 1, duration: 1 * d, ease: "power2.out" }, 0);
      if (scrim.current) tl.to(scrim.current, { opacity: 0, duration: 0.6 * d, ease: "sine.inOut" }, 0.45 * d);
      if (cta.current) tl.to(cta.current, { opacity: 0, duration: 0.25 * d }, 0);
      const item = card.closest(".hero__item") as HTMLElement;
      item.classList.add("is-selected");
      tl.to(others, { opacity: 0, duration: 1 * d, ease: "power1.inOut" }, 0);
      tl.to(card, { opacity: 0, duration: 0.12 * d, ease: "power1.out" }, 0);
      tl.to(g, { x: tx, y: ty, scale: S, duration: cam * d, ease: "power3.out" }, 0);
      // morph: record appears over the (now centred) cover, cover fades
      const size = cardRect.width * S * RATIO;
      tl.set(v, { left: vw / 2 - size / 2, top: vh / 2 - size / 2, width: size, height: size, opacity: 0, rotate: 0 }, 0);
      // hand-off: the in-grid record is swapped for the fixed record at the end of the camera move
      const inGrid = item.querySelector<HTMLElement>(".hero__record");
      tl.set(v, { opacity: 1 }, cam * d);
      if (inGrid) tl.set(inGrid, { opacity: 0 }, cam * d);
      // glide to its slot
      const to = rectOf(sl);
      tl.to(v, { left: to.left, top: to.top, width: to.width, height: to.height, duration: MORPH_IN * d, ease: "power3.out" }, cam * d);
      tl.fromTo(c, { opacity: 0, "--reveal": "0%" }, { opacity: 1, "--reveal": "100%", duration: 1.1 * d, ease: "sine.inOut" }, cam * d + 0.1 * d);
    }
  }, [grid, scrim, cta, wash]);

  const close = useCallback((after?: () => void) => {
    const s = state.current; if (s.busy || !s.open || !grid.current) return;
    s.busy = true;
    const g = grid.current, v = vinyl.current!, w = wash.current!, c = copy.current!, card = s.card!;
    const d = reduce() ? 0 : 1;
    audio.current?.pause(); setPlaying(false);
    const vw = window.innerWidth, vh = window.innerHeight;
    const size = rectOf(card).width * RATIO;
    const items = Array.from(g.querySelectorAll<HTMLElement>(".hero__item"));
    const tl = gsap.timeline({ onComplete: () => {
      s.busy = false; s.open = false; s.card = null; setEp(null);
      document.documentElement.classList.remove("hero-is-active");
      window.dispatchEvent(new CustomEvent("acq:navtheme", { detail: "" }));
      gsap.set(items, { clearProps: "opacity" }); gsap.set(card, { clearProps: "opacity" });
      item.classList.remove("is-selected"); if (inGrid) gsap.set(inGrid, { clearProps: "opacity" });
      card.querySelector<HTMLElement>(".hero__open")?.focus({ preventScroll: true });
      after?.();
    } });
    tl.to(c, { opacity: 0, duration: 0.25 * d }, 0);
    tl.to(v, { left: vw / 2 - size / 2, top: vh / 2 - size / 2, width: size, height: size, rotate: 0, duration: MORPH_OUT * d, ease: "power3.inOut" }, 0);
    const item = card.closest(".hero__item") as HTMLElement;
    const inGrid = item.querySelector<HTMLElement>(".hero__record");
    if (inGrid) tl.set(inGrid, { opacity: 1 }, MORPH_OUT * d);
    tl.set(v, { opacity: 0 }, MORPH_OUT * d);
    tl.to(card, { opacity: 1, duration: 0.3 * d }, MORPH_OUT * d + 0.2 * d);
    tl.to(g, { x: 0, y: 0, scale: 1, duration: CAMERA * d, ease: "power3.out" }, MORPH_OUT * d);
    tl.to(items, { opacity: 1, duration: 0.48 * d }, MORPH_OUT * 0.9 * d);
    tl.to(w, { opacity: 0, duration: 1.1 * d, ease: "sine.inOut" }, MORPH_OUT * 0.6 * d);
    if (scrim.current) tl.to(scrim.current, { opacity: 1, duration: 0.5 * d, ease: "power2.out" }, MORPH_OUT * 0.9 * d);
    if (cta.current) tl.to(cta.current, { opacity: 1, duration: 0.5 * d }, MORPH_OUT * 1.2 * d);
  }, [grid, scrim, cta, wash]);

  const toEpisode = () => {
    if (!ep) return;
    const s = state.current; if (s.busy) return;
    const v = vinyl.current!; const d = reduce() ? 0 : 1;
    s.busy = true;
    gsap.timeline({ onComplete: () => router.push(`/episodes/${ep.slug}`) })
      .to(copy.current, { opacity: 0, duration: 0.3 * d }, 0)
      .to(v, { rotate: "+=180", duration: 1.22 * d, ease: "power1.inOut" }, 0)
      .to(v, { x: window.innerWidth * 0.6, duration: 0.3 * d, ease: "power3.inOut" }, 0.4 * d);
  };

  const togglePlay = () => {
    if (!ep) return;
    if (!ep.audioSrc) return toEpisode();
    const a = audio.current; if (!a) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {}); else { a.pause(); setPlaying(false); }
  };

  useImperativeHandle(ref, () => ({ open, isOpen: () => state.current.open || state.current.busy }), [open]);

  useEffect(() => {
    if (!ep) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = ""; };
  }, [ep, close]);

  return (
    <div className={`hero-vinyl ${ep ? "is-active" : ""}`} data-ep-theme={ep?.theme} aria-hidden={!ep}>
      <div className="hero-vinyl__layout">
        <div ref={copy} className="hero-vinyl__copy" role={ep ? "dialog" : undefined} aria-label={ep?.title}>
          <button className="btn btn--back hero-vinyl__back" onClick={() => close()}><ArrowLeft />Back</button>
          <div className="spacer-base" />
          <div className="hero-vinyl__title">{ep?.title}</div>
          <p className="hero-vinyl__sub">{ep?.heroLine ?? ep?.description}</p>
          <div className="spacer-sm" />
          <div className="hero-vinyl__cta">
            <button className="btn btn--cream btn--lg" onClick={togglePlay}>{playing ? "Pause" : "Play"}</button>
            {ep && <Link className="btn btn--lg hero-vinyl__ep" href={`/episodes/${ep.slug}`} onClick={(e) => { e.preventDefault(); toEpisode(); }}>Episode</Link>}
          </div>
        </div>
        <div ref={slot} className="hero-vinyl__slot" aria-hidden />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={vinyl} className={`hero-vinyl__record ${playing ? "is-spinning" : ""}`} src={ep?.vinyl || undefined} alt="" style={{ opacity: 0 }} />
      {ep?.audioSrc && <audio ref={audio} src={ep.audioSrc} preload="none" onEnded={() => setPlaying(false)} />}
    </div>
  );
});

export default HeroVinyl;
