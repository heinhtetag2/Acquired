"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FREE_PER_DAY, PLUS_PRICE, onPlusChange, overFreeLimit, setPlus } from "@/lib/plus";
import { onProfileChange } from "@/lib/profile";

/* The paywall, at the moment of curiosity: past today's free stories, the story fades out after its opening and this
   card offers Plus (or tomorrow's free stories). Demo only: no payment is taken. */

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Check = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5.5 12.5l4 4 9-9.5" {...ic} /></svg>);
const PERKS = ["Unlimited stories, every day", "Listen to every story", "Series and deep dives", "Offline reading and notes export"];

export default function PlusGate({ slug }: { slug: string }) {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    // after MarkRead has logged this visit (same tick), check where it falls in today's reading
    const check = () => setLocked(overFreeLimit(slug));
    const t = setTimeout(check, 0);
    const offA = onPlusChange(check), offB = onProfileChange(check);
    return () => { clearTimeout(t); offA(); offB(); };
  }, [slug]);
  useEffect(() => {
    document.documentElement.classList.toggle("sb-locked", locked);
    return () => document.documentElement.classList.remove("sb-locked");
  }, [locked]);
  if (!locked) return null;

  return (
    <div className="pg" role="dialog" aria-modal="false" aria-labelledby="pg-title">
      <p className="pg__eyebrow t-label-xs">Scrollbook Plus</p>
      <h2 id="pg-title" className="pg__title">You&rsquo;ve read your {FREE_PER_DAY} free stories today</h2>
      <p className="pg__sub">Keep reading with Plus, or come back tomorrow for {FREE_PER_DAY} more.</p>
      <ul className="pg__perks">{PERKS.map((p) => <li key={p}><Check />{p}</li>)}</ul>
      <p className="pg__price">7 days free, then {PLUS_PRICE.month}/month or {PLUS_PRICE.year}/year</p>
      <button type="button" className="pg__cta" onClick={() => setPlus(true)}>Try 7 days free</button>
      <Link href="/" className="pg__later t-label-xs">Back to Discover</Link>
      <p className="pg__fine">Demo: no payment is taken. Plus turns on in this browser only.</p>
    </div>
  );
}
