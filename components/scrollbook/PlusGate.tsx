"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FREE_PER_DAY, PLUS_PRICE, onPlusChange, overFreeLimit, setPlus } from "@/lib/plus";
import { onProfileChange } from "@/lib/profile";

/* The paywall, at the moment of curiosity: past today's free stories, the story fades out after its opening, the page
   dims behind, and this card offers Plus: a sparkle badge, the offer, Monthly / Yearly, what you get, one button.
   Demo only: no payment is taken. */

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Check = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5.5 12.5l4 4 9-9.5" {...ic} /></svg>);
// Plus: an open book with a sparkle over it (stories, unlocked)
const PlusBadge = () => (
  <svg viewBox="0 0 48 48" aria-hidden>
    <g fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 19c-3.6-2.6-8.6-3-13-2.2v19.4c4.4-.8 9.4-.4 13 2.2 3.6-2.6 8.6-3 13-2.2V16.8c-4.4-.8-9.4-.4-13 2.2Z" />
      <path d="M24 19v19.4" />
    </g>
    <path d="M24 4.5c.5 3.2 2.3 5 5.5 5.5-3.2.5-5 2.3-5.5 5.5-.5-3.2-2.3-5-5.5-5.5 3.2-.5 5-2.3 5.5-5.5Z" fill="currentColor" />
  </svg>
);
const PERKS = ["Unlimited stories, every day", "Every new story the day it lands", "Save and highlight without limits"];
const num = (p: string) => parseFloat(p.replace(/[^0-9.]/g, ""));
const SAVE = Math.round((1 - num(PLUS_PRICE.year) / (num(PLUS_PRICE.month) * 12)) * 100); // yearly vs 12 months
const PER_MONTH_YEARLY = `$${(num(PLUS_PRICE.year) / 12).toFixed(2)}`;

export default function PlusGate({ slug }: { slug: string }) {
  const [locked, setLocked] = useState(false);
  const [plan, setPlan] = useState<"month" | "year">("year");
  useEffect(() => {
    // free = the first 3 stories you finish today; a story you already finished today stays open
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
    <>
      <div className="pg-bg" aria-hidden />
      <div className="pg" role="dialog" aria-modal="true" aria-labelledby="pg-title">
        <span className="pg__badge" aria-hidden><PlusBadge /></span>
        <p className="pg__eyebrow t-label-xs">Scrollbook Plus</p>
        <h2 id="pg-title" className="pg__title">You&rsquo;ve read your {FREE_PER_DAY} free stories today</h2>
        <p className="pg__sub">Keep going with Plus, or come back tomorrow for {FREE_PER_DAY} more.</p>

        {/* billing: monthly or yearly (yearly picked, it's the better deal) */}
        <div className="pg__plans" role="radiogroup" aria-label="Billing">
          <button type="button" role="radio" aria-checked={plan === "month"} className="pg__plan" onClick={() => setPlan("month")}>
            <span className="pg__plan-name">Monthly</span>
            <span className="pg__plan-price">{PLUS_PRICE.month}/mo</span>
          </button>
          <button type="button" role="radio" aria-checked={plan === "year"} className="pg__plan" onClick={() => setPlan("year")}>
            <span className="pg__plan-save t-label-xs">Save {SAVE}%</span>
            <span className="pg__plan-name">Yearly</span>
            <span className="pg__plan-price">{PER_MONTH_YEARLY}/mo</span>
          </button>
        </div>

        <ul className="pg__perks">{PERKS.map((p) => <li key={p}><Check />{p}</li>)}</ul>
        <p className="pg__price">7 days free, then {plan === "year" ? `${PLUS_PRICE.year} a year` : `${PLUS_PRICE.month} a month`}. Cancel anytime.</p>
        <button type="button" className="pg__cta" onClick={() => setPlus(true)}>Try 7 days free</button>
        <Link href="/" className="pg__later t-label-xs">Back to Discover</Link>
        <p className="pg__fine">Demo: no payment is taken. Plus turns on in this browser only.</p>
      </div>
    </>
  );
}
