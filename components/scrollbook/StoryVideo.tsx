"use client";
import { useEffect, useId, useRef, useState } from "react";

/* A video inside a story, built so it never fights with the reading:
   - before playing: its first frame as a thumbnail and a play button (no timers: they read as clutter here)
   - tap: plays with sound; only one story video plays at a time, and it pauses when scrolled out of view
   - controls in the story's colours: tap the picture to pause / play, a thin progress bar to skip, sound, fullscreen
   - at the end: back to the thumbnail with a replay button */

const EVT = "sb:story-video"; // detail = id of the video that just started; the others pause
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
// the triangle sits on its visual centre (its centroid at 12,12), so it looks centred in the round button
const PlayIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M8.5 5.5v13L19 12z" fill="currentColor" /></svg>);
const PauseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M8 5.5v13M16 5.5v13" {...ic} strokeWidth={2.4} /></svg>);
const ReplayIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" {...ic} strokeWidth={2} /></svg>);
const SoundIcon = ({ off }: { off: boolean }) => (<svg viewBox="0 0 24 24" aria-hidden><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" {...ic} />{off ? <path d="M16 9.5l5 5M21 9.5l-5 5" {...ic} /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...ic} />}</svg>);
const FullIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" {...ic} /></svg>);

export default function StoryVideo({ src, caption }: { src: string; caption?: string }) {
  const id = useId();
  const ref = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "paused" | "ended">("idle");
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(false);
  const live = state === "playing" || state === "paused";

  // only one story video at a time, and none playing off-screen
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (v.readyState >= 1 && v.duration) setDur(v.duration); // metadata can arrive before the page is interactive
    const other = (e: Event) => { if ((e as CustomEvent<string>).detail !== id && !v.paused) v.pause(); };
    window.addEventListener(EVT, other);
    // leaving full screen pauses it, so you land back in the story in silence
    const onFs = () => { if (!document.fullscreenElement && !v.paused) v.pause(); };
    const onIosEnd = () => { if (!v.paused) v.pause(); };
    document.addEventListener("fullscreenchange", onFs);
    v.addEventListener("webkitendfullscreen", onIosEnd);
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0.25 });
    if (box.current) io.observe(box.current);
    return () => { window.removeEventListener(EVT, other); io.disconnect(); document.removeEventListener("fullscreenchange", onFs); v.removeEventListener("webkitendfullscreen", onIosEnd); };
  }, [id]);

  // the first tap on the thumbnail opens the clip full screen and plays it (like a short video app)
  const open = () => { full(); play(); };
  const play = () => {
    const v = ref.current; if (!v) return;
    if (state === "idle" || state === "ended") v.currentTime = 0;
    window.dispatchEvent(new CustomEvent(EVT, { detail: id }));
    v.play().catch(() => {});
  };
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) play(); else v.pause(); };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current; if (!v || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
  };
  // full screen: the whole frame (video + our controls) where the browser allows it; iPhone Safari only lets the
  // video itself go full screen, with its own controls
  const full = () => {
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null; if (!v) return;
    const f = box.current;
    if (document.fullscreenElement === f) { document.exitFullscreen().catch(() => {}); return; } // the same button leaves full screen
    if (f?.requestFullscreen) f.requestFullscreen().catch(() => v.webkitEnterFullscreen?.()); else v.webkitEnterFullscreen?.();
  };

  return (
    <figure className={`sb-story__video is-${state}`}>
      <div ref={box} className="sb-story__video-frame">
        {/* "#t=0.1" makes browsers paint the first frame as the thumbnail before anything plays */}
        <video ref={ref} src={`${src}#t=0.1`} playsInline preload="metadata" muted={muted} onClick={live ? toggle : undefined}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          onPlay={() => setState("playing")} onPause={(e) => { if (!e.currentTarget.ended) setState("paused"); }} onEnded={() => setState("ended")} />

        {!live && (
          <button type="button" className="sb-story__video-play" onClick={open} aria-label={`${state === "ended" ? "Replay" : "Play"}${caption ? `: ${caption}` : ""}`}>
            <span className="sb-story__video-btn">{state === "ended" ? <ReplayIcon /> : <PlayIcon />}</span>
          </button>
        )}

        {live && (
          <div className="sb-story__video-bar">
            <button type="button" onClick={toggle} aria-label={state === "playing" ? "Pause" : "Play"}>{state === "playing" ? <PauseIcon /> : <PlayIcon />}</button>
            <div className="sb-story__video-track" onClick={seek} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(t)} tabIndex={0}
              onKeyDown={(e) => { const v = ref.current; if (!v) return; if (e.key === "ArrowRight") v.currentTime = Math.min(dur, v.currentTime + 2); if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 2); }}>
              <span style={{ width: `${dur ? (t / dur) * 100 : 0}%` }} />
            </div>
            <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Sound on" : "Sound off"}><SoundIcon off={muted} /></button>
            <button type="button" onClick={full} aria-label="Fullscreen"><FullIcon /></button>
          </div>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
