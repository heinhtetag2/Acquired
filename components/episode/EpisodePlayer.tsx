"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { formatDate, formatTime } from "@/lib/site";
import type { EpisodeLite as Episode } from "@/lib/content";
import { cssNum } from "@/lib/motion";
import { PlayIcon, PauseIcon, Skip, CloseIcon } from "../Icons";

const SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.75];
const SKIP = 15;
const KEY = "acqAudioStateV1"; // live key name; stores position per episode

/** Fixed mini-player. Minimise/expand is a GSAP height tween (live: 0.25s power2.out, 75px minimised). */
export default function EpisodePlayer({ ep, autoPlay }: { ep: Episode; autoPlay?: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(ep.durationSec ?? 0);
  const [speed, setSpeed] = useState(0);
  const [min, setMin] = useState<boolean | null>(null); // null = not hydrated; CSS picks the default by width
  const [userToggled, setUserToggled] = useState(false);
  const [popup, setPopup] = useState(false);

  // restore position
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}")[ep.slug];
      if (saved && audio.current) { audio.current.currentTime = saved; setTime(saved); }
    } catch {}
    setMin(window.matchMedia("(max-width: 991px)").matches);
    if (autoPlay) audio.current?.play().catch(() => {});
  }, [ep.slug, autoPlay]);

  // persist every few seconds
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      try { const all = JSON.parse(localStorage.getItem(KEY) || "{}"); all[ep.slug] = audio.current?.currentTime ?? 0; localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [playing, ep.slug]);

  // external seeks (chapters / #t= links) + popup state
  useEffect(() => {
    const onSeek = (e: Event) => {
      const a = audio.current; if (!a) return;
      a.currentTime = (e as CustomEvent<number>).detail; setTime(a.currentTime);
      a.play().catch(() => {});
    };
    const onPopup = (e: Event) => setPopup((e as CustomEvent<boolean>).detail);
    const onToggle = () => { const a = audio.current; if (a) (a.paused ? a.play().catch(() => {}) : a.pause()); };
    window.addEventListener("acq:toggle", onToggle);
    window.addEventListener("acq:seek", onSeek); window.addEventListener("acq:popup", onPopup);
    return () => { window.removeEventListener("acq:seek", onSeek); window.removeEventListener("acq:popup", onPopup); window.removeEventListener("acq:toggle", onToggle); };
  }, []);

  // auto-minimise once the episode section is scrolled past (live AUTO_MINIMIZE_SECTION)
  useEffect(() => {
    const section = document.querySelector(".ep");
    if (!section) return;
    const onScroll = () => {
      if (userToggled || window.matchMedia("(max-width: 991px)").matches) return;
      setMin(section.getBoundingClientRect().bottom < window.innerHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [userToggled]);

  // animate height when min changes
  const first = useRef(true);
  useEffect(() => {
    const el = player.current; if (!el) return;
    if (first.current || min === null) { if (min !== null) first.current = false; return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = cssNum("--gsap-player-dur", 0.25);
    const from = el.dataset.h ? parseFloat(el.dataset.h) : el.offsetHeight;
    el.style.height = "";
    const to = el.offsetHeight;
    gsap.fromTo(el, { height: from }, { height: to, duration: d, ease: "power2.out", clearProps: "height" });
    const fades = el.querySelectorAll(".player__times, .player__row");
    if (!min) gsap.fromTo(fades, { opacity: 0 }, { opacity: 1, duration: d * 0.5, delay: d * 0.35, ease: "power2.out" });
  }, [min]);
  const remember = () => { if (player.current) player.current.dataset.h = String(player.current.offsetHeight); };

  const toggle = useCallback(() => {
    const a = audio.current; if (!a || !ep.audioSrc) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }, [ep.audioSrc]);

  const skip = (d: number) => { const a = audio.current; if (a) { a.currentTime = Math.max(0, Math.min(dur, a.currentTime + d)); setTime(a.currentTime); } };
  const cycleSpeed = () => { const n = (speed + 1) % SPEEDS.length; setSpeed(n); if (audio.current) audio.current.playbackRate = SPEEDS[n]; };
  const pct = dur ? (time / dur) * 100 : 0;
  const art = ep.image ?? ep.cover;

  return (
    <div className={`player-wrap ${min === null && !popup ? "is-auto" : min || popup ? "is-minimized" : ""} ${popup ? "is-popup-open" : ""}`}>
      <div ref={player} className="player" role="region" aria-label="Episode player">
        {ep.audioSrc && (
          <audio ref={audio} src={ep.audioSrc} preload="none"
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration || dur)} />
        )}
        <div className="player__head" onClick={() => { if (min) { remember(); setUserToggled(true); setMin(false); } }}>
          <div className="player__thumb">{art && <img src={art} alt="" />}</div>
          <div className="player__meta t-label">
            <div className="player__title">{ep.title}</div>
            <div className="muted">{formatDate(ep.date)}</div>
          </div>
          <button className="player__play player__mini-play" onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={playing ? "Pause" : "Play"} disabled={!ep.audioSrc}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="player__min" onClick={(e) => { e.stopPropagation(); remember(); setUserToggled(true); setMin(true); }} aria-label="Minimize player"><CloseIcon /></button>
        </div>
        <div className="player__controls">
          <div className="player__progress">
            <div className="player__progress-fill" style={{ width: `${pct}%` }} />
            <input type="range" min={0} max={dur || 1} step={1} value={time} aria-label="Seek" aria-valuetext={formatTime(time)}
              onChange={(e) => { const v = +e.target.value; setTime(v); if (audio.current) audio.current.currentTime = v; }} />
          </div>
          <div className="player__times t-label"><span>{formatTime(time)}</span><span>{formatTime(dur)}</span></div>
          <div className="player__row">
            <button className="player__ctl player__speed" onClick={cycleSpeed} aria-label={`Playback speed ${SPEEDS[speed]}x`}>{SPEEDS[speed]}x</button>
            <button className="player__ctl" onClick={() => skip(-SKIP)} aria-label="Back 15 seconds"><Skip back /></button>
            <button className="player__play" onClick={toggle} aria-label={playing ? "Pause" : "Play"} disabled={!ep.audioSrc}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
            <button className="player__ctl" onClick={() => skip(SKIP)} aria-label="Forward 15 seconds"><Skip /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
