"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Article } from "@/lib/content";

/* Daily progress through a book: which articles are read, and on which day.
   Kept in this browser only (localStorage) until there are accounts. */
const KEY = "scrollbook:progress";
const EVT = "sb:progress"; // fired on this page whenever progress is saved
type Progress = Record<number, string>; // article index -> yyyy-mm-dd it was read

const today = () => new Date().toLocaleDateString("en-CA");

function readAll(): Record<string, Progress> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function load(slug: string): Progress { return readAll()[slug] ?? {}; }
function save(slug: string, p: Progress) {
  try { const all = readAll(); all[slug] = p; localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: slug }));
}

/** Mark an article read (or unread). Any progress pill on the page animates to the new state.
    Use this from the future article page / "mark as read" control. */
export function setRead(slug: string, index: number, read = true) {
  const p = { ...load(slug) };
  if (read) p[index] = p[index] ?? today(); else delete p[index];
  save(slug, p);
}

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const CheckIcon = () => (<svg viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="5.75" {...ic} /><path d="M5.6 8.2l1.6 1.6 3.2-3.4" {...ic} /></svg>);
const ClockIcon = () => (<svg viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="5.75" {...ic} /><path d="M8 5v3.2l2 1.3" {...ic} /></svg>);
const BookIcon = () => (<svg viewBox="0 0 16 16" aria-hidden><path d="M8 4.5C6.8 3.6 5 3.2 2.5 3.2v9c2.5 0 4.3.4 5.5 1.3 1.2-.9 3-1.3 5.5-1.3v-9C11 3.2 9.2 3.6 8 4.5zM8 4.5v9" {...ic} /></svg>);

/** Animates a whole number from its last value to `target` (instant with reduced motion). */
function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { from.current = target; setValue(target); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms), eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(start + (target - start) * eased);
      from.current = v; setValue(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/** Top-right pill: a progress ring and "2 / 14". Animates whenever progress changes (setRead, another tab, coming back to the page). */
export default function TodayProgress({ slug, articles, demoRead = 0 }: { slug: string; articles: Article[]; demoRead?: number }) {
  const [p, setP] = useState<Progress>({});
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(() => {
    const saved = load(slug);
    setLoaded(true);
    if (Object.keys(saved).length || !demoRead) { setP(saved); return; }
    // demo: the first `demoRead` articles read on the days before today, saved so real reads continue from it
    const demo: Progress = {};
    for (let i = 0; i < demoRead; i++) { const d = new Date(); d.setDate(d.getDate() - (demoRead - i)); demo[i] = d.toLocaleDateString("en-CA"); }
    try { const all = readAll(); all[slug] = demo; localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
    setP(demo);
  }, [slug, demoRead]);

  // re-read progress when it changes here, in another tab, or when the reader comes back to this page
  useEffect(() => {
    refresh();
    const onEvt = (e: Event) => { if ((e as CustomEvent<string>).detail === slug) refresh(); };
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener(EVT, onEvt); window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", refresh); document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(EVT, onEvt); window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", refresh); document.removeEventListener("visibilitychange", onVisible);
    };
  }, [slug, refresh]);

  const total = articles.length;
  const done = Object.keys(p).length;
  const readToday = Object.entries(p).filter(([, d]) => d === today()).map(([i]) => +i);
  // today's article: the one read today if there is one, otherwise the next unread
  const next = articles.findIndex((_, i) => !p[i]);
  const cur = readToday.length ? Math.max(...readToday) : next;
  const finished = cur < 0;

  // ring shows how much of the book is read; the number is today's article
  const r = 6, c = 2 * Math.PI * r, frac = done / total;
  // the ring starts empty and sweeps to the real amount (CSS transition), and again on every change
  const [shown, setShown] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(frac)); return () => cancelAnimationFrame(id); }, [frac]);
  // the number counts up to today's article, in step with the ring sweep (900ms, ease-out)
  const num = finished ? total : cur + 1;
  const shownNum = useCountUp(loaded ? num : 1);
  // a short glow on the pill when an article gets marked read (not on first load)
  const prevDone = useRef<number | null>(null);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (prevDone.current !== null && done > prevDone.current) {
      setBump(true); const t = setTimeout(() => setBump(false), 900); prevDone.current = done; return () => clearTimeout(t);
    }
    prevDone.current = done;
  }, [done]);
  const tipId = useId();
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [caret, setCaret] = useState(48);
  // point the card's arrow at the middle of the pill
  useEffect(() => { if (btn.current) setCaret(btn.current.offsetWidth / 2); }, [open, cur, total]);
  // close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="sb-progress-wrap" ref={box}>
      <button type="button" className={`sb-progress${bump ? " is-bump" : ""}`} aria-describedby={tipId} onClick={() => setOpen((o) => !o)}
        aria-label={finished ? `All ${total} articles read` : `Today: article ${cur + 1} of ${total}, ${done} read`}
        ref={btn}>
        <span className="sb-progress__label">{finished ? "Done" : "Today"}</span>
        <svg className="sb-progress__ring" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="8" r={r} />
          <circle cx="8" cy="8" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - shown)} style={{ strokeOpacity: shown > 0 ? 1 : 0 }} />
        </svg>
        <span className="sb-progress__count"><span className="sb-progress__num">{shownNum}</span> / {total}</span>
      </button>

      <div id={tipId} role="tooltip" className={`sb-tip${open ? " is-open" : ""}`} style={{ "--caret": `${caret}px` } as React.CSSProperties}>
        {finished ? (
          <span className="sb-tip__row"><CheckIcon />You finished all {total} articles in this book.</span>
        ) : (
          <>
            <span className="sb-tip__row"><BookIcon /><span>Today&rsquo;s read: <b>{articles[cur].title}</b></span></span>
            <span className="sb-tip__row"><CheckIcon /><span>{done} of {total} articles done</span></span>
            <span className="sb-tip__row"><ClockIcon /><span>{articles[cur].min} min read</span></span>
          </>
        )}
      </div>
    </div>
  );
}
