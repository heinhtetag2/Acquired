"use client";
import { useEffect, useId, useRef, useState } from "react";
import { dayKey, loadGoal, onProfileChange, readsByDay, streak } from "@/lib/profile";
import { loadSeen } from "@/lib/seen";

/* Top-right pill on a story: today's reading against your daily goal ("Today ◔ 1 / 3"), "Done" once the goal is met.
   A story counts when you reach its end (ReadEnd), and the pill fills right then. Tap / hover for the details. */
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const CheckIcon = () => (<svg viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="5.75" {...ic} /><path d="M5.6 8.2l1.6 1.6 3.2-3.4" {...ic} /></svg>);
const BookIcon = () => (<svg viewBox="0 0 16 16" aria-hidden><path d="M8 4.5C6.8 3.6 5 3.2 2.5 3.2v9c2.5 0 4.3.4 5.5 1.3 1.2-.9 3-1.3 5.5-1.3v-9C11 3.2 9.2 3.6 8 4.5zM8 4.5v9" {...ic} /></svg>);
const FlameIcon = () => (<svg viewBox="0 0 16 16" aria-hidden><path d="M8 14c2.5 0 4.25-1.7 4.25-4.1 0-2.6-2.1-4.2-3.1-6.9-.9 1.4-1.2 2.6-1.1 3.6C7.2 5.7 6.6 4.9 6.4 4 4.9 5.4 3.75 7.3 3.75 9.9 3.75 12.3 5.5 14 8 14Z" {...ic} /></svg>);

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

export default function TodayProgress({ slug }: { slug: string }) {
  const [s, setS] = useState({ today: 0, goal: 3, run: 0, thisRead: false, loaded: false });
  useEffect(() => {
    const refresh = () => {
      const days = readsByDay();
      setS({ today: days[dayKey()]?.length ?? 0, goal: loadGoal(), run: streak(days), thisRead: loadSeen()[slug]?.s === "read", loaded: true });
    };
    refresh();
    const off = onProfileChange(refresh);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("pageshow", refresh); document.addEventListener("visibilitychange", onVisible);
    return () => { off(); window.removeEventListener("pageshow", refresh); document.removeEventListener("visibilitychange", onVisible); };
  }, [slug]);

  const { today, goal, run, thisRead } = s;
  const done = today >= goal;
  // the ring starts empty and sweeps to today's share of the goal, and again on every change
  const r = 6, c = 2 * Math.PI * r, frac = Math.min(1, today / goal);
  const [shown, setShown] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(frac)); return () => cancelAnimationFrame(id); }, [frac]);
  const shownNum = useCountUp(s.loaded ? today : 0);
  // a short glow on the border as the count goes up: when the story opens (0 → today's count, with the ring sweep
  // and count-up) and again when you finish a story on this page
  const prev = useRef<number | null>(null);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (prev.current !== null && today > prev.current) { setBump(true); const t = setTimeout(() => setBump(false), 900); prev.current = today; return () => clearTimeout(t); }
    prev.current = today;
  }, [today]);

  const tipId = useId();
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [caret, setCaret] = useState(48);
  useEffect(() => { if (btn.current) setCaret(btn.current.offsetWidth / 2); }, [open, today, goal]); // the card's arrow points at the pill
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="sb-progress-wrap" ref={box}>
      <button type="button" ref={btn} className={`sb-progress${bump ? " is-bump" : ""}`} aria-describedby={tipId} onClick={() => setOpen((o) => !o)}
        aria-label={done ? `Daily goal done: ${today} stories read today` : `Today: ${today} of ${goal} stories read`}>
        <span className="sb-progress__label">{done ? "Done" : "Today"}</span>
        <svg className="sb-progress__ring" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="8" r={r} />
          <circle cx="8" cy="8" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - shown)} style={{ strokeOpacity: shown > 0 ? 1 : 0 }} />
        </svg>
        <span className="sb-progress__count"><span className="sb-progress__num">{shownNum}</span> / {goal}</span>
      </button>

      <div id={tipId} role="tooltip" className={`sb-tip${open ? " is-open" : ""}`} style={{ "--caret": `${caret}px` } as React.CSSProperties}>
        <span className="sb-tip__row"><CheckIcon /><span>{done ? <>Daily goal done: <b>{today} {today === 1 ? "story" : "stories"}</b> today</> : <><b>{today} of {goal}</b> stories read today</>}</span></span>
        <span className="sb-tip__row"><BookIcon /><span>{thisRead ? "You finished this story" : "Read to the end and this one counts"}</span></span>
        {run > 0 && <span className="sb-tip__row"><FlameIcon /><span><b>{run}-day</b> streak</span></span>}
      </div>
    </div>
  );
}
