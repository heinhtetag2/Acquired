"use client";
/* Scrollbook Plus (demo): the business model in the app. Free = unlimited cards in Discover and 3 full stories a day;
   Plus = unlimited stories, audio, series, offline + notes export. There are no payments yet: "Try 7 days free"
   just turns Plus on in this browser, and the profile can turn it off again to show the paywall. */
import { dayKey } from "./profile";

export const FREE_PER_DAY = 3;
export const PLUS_PRICE = { month: "$5.99", year: "$39.99" };
const KEY = "scrollbook:plus";
const EVT = "sb:plus";

export const isPlus = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
export function setPlus(on: boolean) {
  try { if (on) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); } catch {}
  window.dispatchEvent(new Event(EVT));
}
export function onPlusChange(cb: () => void) { window.addEventListener(EVT, cb); return () => window.removeEventListener(EVT, cb); }

/** Is this story past today's free allowance? Free = 3 stories finished a day (reaching the end counts, opening doesn't);
    a story you already finished today stays free to reopen. */
export function overFreeLimit(slug: string): boolean {
  if (isPlus()) return false;
  let today: string[] = [];
  try { today = (JSON.parse(localStorage.getItem("scrollbook:activity") || "{}") as Record<string, string[]>)[dayKey()] ?? []; } catch {}
  const i = today.indexOf(slug);
  return (i < 0 ? today.length : i) >= FREE_PER_DAY;
}
