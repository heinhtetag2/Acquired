"use client";
/* The reader's profile, kept in this browser until there are accounts:
   whether they've been through onboarding, their interests (topic slugs), daily goal, name,
   and a day-by-day log of the stories they opened (for streaks and "this week"). */
import { loadSeen } from "./seen";
import filters from "@/content/filters.json";

// interests saved before the 8 broad categories used the narrower topics ("software", "film"): map them to their category
const CATEGORY_OF = new Map<string, string>();
for (const f of filters as { group: string; slug: string; parts?: string[] }[]) {
  if (f.group !== "category") continue;
  CATEGORY_OF.set(f.slug, f.slug);
  for (const p of f.parts ?? []) CATEGORY_OF.set(p, f.slug);
}

const K = {
  onboarded: "scrollbook:onboarded", // timestamp they finished (or skipped) onboarding
  interests: "scrollbook:interests",
  goal: "scrollbook:goal",
  name: "scrollbook:name",
  activity: "scrollbook:activity",   // { "yyyy-mm-dd": [slug, …] }
  account: "scrollbook:account",     // demo sign-in: { method, email?, at }; there are no real accounts yet
};
const EVT = "sb:profile";

const get = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const set = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} window.dispatchEvent(new Event(EVT)); };

export const GOALS = [
  { n: 1, label: "Quick dip", sub: "1 story a day · about 5 min" },
  { n: 3, label: "Steady", sub: "3 stories a day · about 15 min" },
  { n: 5, label: "Deep dive", sub: "5 stories a day · about 25 min" },
] as const;

export const dayKey = (t: number | Date = Date.now()) => new Date(t).toLocaleDateString("en-CA");

export const onboardedAt = () => get<number | null>(K.onboarded, null);
export const setOnboarded = () => { if (!onboardedAt()) set(K.onboarded, Date.now()); };
export const resetOnboarding = () => { try { localStorage.removeItem(K.onboarded); } catch {} };
export const loadInterests = () => [...new Set(get<string[]>(K.interests, []).map((s) => CATEGORY_OF.get(s)).filter((s): s is string => !!s))];
export const saveInterests = (v: string[]) => set(K.interests, v);
export const loadGoal = () => get<number>(K.goal, 3);
export const saveGoal = (n: number) => set(K.goal, n);
export const loadName = () => get<string>(K.name, "");
export const saveName = (v: string) => set(K.name, v.trim());
export type Account = { method: "apple" | "google" | "email"; email?: string; at: number };
export const loadAccount = () => get<Account | null>(K.account, null);
export const saveAccount = (a: Omit<Account, "at">) => set(K.account, { ...a, at: Date.now() });

/** Log a story opened today (called when a story is read). */
export function logRead(slug: string) {
  const a = get<Record<string, string[]>>(K.activity, {});
  const d = dayKey();
  if (!(a[d] ??= []).includes(slug)) a[d].push(slug);
  set(K.activity, a);
}

/** Stories read per day: the activity log, plus older reads that only live in the "seen" list. */
export function readsByDay(): Record<string, string[]> {
  const a = { ...get<Record<string, string[]>>(K.activity, {}) };
  for (const [slug, v] of Object.entries(loadSeen())) {
    if (v.s !== "read") continue;
    if (Object.values(a).some((l) => l.includes(slug))) continue;
    (a[dayKey(v.t)] ??= []).push(slug);
  }
  return a;
}

/** Days in a row with at least one story, ending today (or yesterday, if today hasn't started yet). */
export function streak(days: Record<string, string[]>) {
  const d = new Date();
  if (!days[dayKey(d)]?.length) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dayKey(d)]?.length) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function onProfileChange(cb: () => void) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
