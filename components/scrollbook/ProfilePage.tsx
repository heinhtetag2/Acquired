"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { loadSaved } from "@/lib/saved";
import { FREE_PER_DAY, PLUS_PRICE, isPlus, onPlusChange, setPlus } from "@/lib/plus";
import { allThreads, onNotesChange, type SlugThread } from "@/lib/notes";
import { GOALS, dayKey, loadGoal, loadInterests, loadName, onboardedAt, onProfileChange, readsByDay, resetOnboarding, saveGoal, saveName, streak } from "@/lib/profile";

/* You (the profile), on the Shelf's cream page:
   who you are → today (goal ring + streak) → your numbers → this week → topics you read most →
   your interests and daily goal. The rest of the site lives in the bottom bar's More sheet, which links here. */

export type StoryInfo = { title: string; art?: string; topic: string };

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ArrowIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" {...ic} /></svg>);
const DAY = 86_400_000;

export default function ProfilePage({ stories, topics }: { stories: Record<string, StoryInfo>; topics: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState(3);
  const [interests, setInterests] = useState<string[]>([]);
  const [days, setDays] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState<string[]>([]);
  const [notes, setNotes] = useState<SlugThread[]>([]);
  const [since, setSince] = useState<number | null>(null);
  const [plus, setPlusState] = useState(false);
  useEffect(() => { const sync = () => setPlusState(isPlus()); sync(); return onPlusChange(sync); }, []);

  useEffect(() => {
    const load = () => {
      setName(loadName()); setGoal(loadGoal()); setInterests(loadInterests()); setDays(readsByDay());
      setSaved(loadSaved()); setNotes(allThreads()); setSince(onboardedAt()); setReady(true);
    };
    load();
    const offP = onProfileChange(load), offN = onNotesChange(load);
    return () => { offP(); offN(); };
  }, []);

  const today = days[dayKey()]?.length ?? 0;
  const run = streak(days);
  const allRead = useMemo(() => [...new Set(Object.values(days).flat())].filter((s) => stories[s]), [days, stories]);
  const highlights = notes.filter((t) => !t.notes.length).length;
  const comments = notes.filter((t) => t.notes.length).length;
  // the last 7 days, oldest first
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * DAY); return { key: dayKey(d), label: d.toLocaleDateString("en-US", { weekday: "narrow" }), n: days[dayKey(d)]?.length ?? 0 }; });
  const weekMax = Math.max(goal, ...week.map((w) => w.n));
  const weekTotal = week.reduce((n, w) => n + w.n, 0);
  // topics you read most
  const topTopics = useMemo(() => {
    const m = new Map<string, number>();
    allRead.forEach((s) => m.set(stories[s].topic, (m.get(stories[s].topic) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [allRead, stories]);
  const recent = useMemo(() => Object.entries(days).sort((a, b) => (a[0] < b[0] ? 1 : -1)).flatMap(([, l]) => [...l].reverse()).filter((s, i, a) => stories[s] && a.indexOf(s) === i).slice(0, 6), [days, stories]);

  const shown = name || "Reader";
  const sinceText = since ? new Date(since).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;

  return (
    <div className="me" data-theme="dark">
      <div className="me__inner">
        {/* who: a small serif monogram, your name in sentence case, and when you started */}
        <header className="me__head">
          <span className="me__avatar" aria-hidden>{shown[0].toUpperCase()}</span>
          <div className="me__who">
            {editing ? (
              <input className="me__name-input" autoFocus defaultValue={name} maxLength={30} placeholder="Your first name" aria-label="Your name"
                onBlur={(e) => { saveName(e.target.value); setEditing(false); }} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(false); }} />
            ) : (
              <div className="me__name-row">
                <h1 className="me__name">{ready ? shown : "\u00a0"}</h1>
                <button type="button" className="me__edit-name t-label-xs" onClick={() => setEditing(true)} aria-label="Edit your name">Edit</button>
              </div>
            )}
            <p className="me__since">{sinceText ? `Reading since ${sinceText}` : "Welcome to Scrollbook"}</p>
          </div>
        </header>

        {/* today, compact: the count and where it stands on one line, the goal as thin bars, the streak as a label */}
        <section className="me__day" aria-label="Today">
          <div className="me__day-top">
            <p className="t-label-xs">Today</p>
            <p className={`t-label-xs${run ? " is-on" : ""}`}>{run ? `${run}-day streak` : "No streak yet"}</p>
          </div>
          <p className="me__day-count">
            <b>{today}</b> {today === 1 ? "story" : "stories"}
            <span> · {today >= goal ? "goal done" : `${goal - today} to go`}</span>
          </p>
          <div className="me__day-bars" role="img" aria-label={`${Math.min(today, goal)} of ${goal} for today's goal`}>
            {Array.from({ length: goal }, (_, k) => <span key={k} className={k < today ? "is-on" : ""} />)}
            {today > goal && <em className="t-label-xs">+{today - goal}</em>}
          </div>
        </section>

        {/* numbers */}
        <section className="me__stats" aria-label="Your numbers">
          <Link href="/shelf" className="me__stat"><b>{allRead.length}</b><span className="t-label-xs">Stories read</span></Link>
          <Link href="/shelf" className="me__stat"><b>{saved.length}</b><span className="t-label-xs">Saved</span></Link>
          <Link href="/shelf?tab=notes" className="me__stat"><b>{highlights}</b><span className="t-label-xs">Highlights</span></Link>
          <Link href="/shelf?tab=notes" className="me__stat"><b>{comments}</b><span className="t-label-xs">Comments</span></Link>
        </section>

        {/* this week */}
        <section className="me__card" aria-label="This week">
          <div className="me__card-head"><h2 className="t-label-xs">This week</h2><span className="t-label-xs">{weekTotal} {weekTotal === 1 ? "story" : "stories"}</span></div>
          <div className="me__week">
            {week.map((w) => (
              <div key={w.key} className={`me__bar${w.key === dayKey() ? " is-today" : ""}${w.n >= goal ? " is-met" : ""}`}>
                <span className="me__bar-track"><span style={{ height: `${(w.n / weekMax) * 100}%` }} /></span>
                <span className="t-label-xs">{w.label}</span>
              </div>
            ))}
            {/* daily goal as a dashed line across the bars (bars are 96px tall over a 24px label row) */}
            <span className="me__goal-line" style={{ bottom: 24 + (goal / weekMax) * 96 }} aria-hidden><span className="t-label-xs">Goal</span></span>
          </div>
        </section>

        {/* most-read topics */}
        <section className="me__card" aria-label="Topics you read most">
          <div className="me__card-head"><h2 className="t-label-xs">You read most about</h2></div>
          {topTopics.length ? (
            <ul className="me__topics">
              {topTopics.map(([t, n]) => (
                <li key={t}><span className="me__topic-name">{t}</span><span className="me__topic-bar"><span style={{ width: `${(n / topTopics[0][1]) * 100}%` }} /></span><span className="t-label-xs">{n}</span></li>
              ))}
            </ul>
          ) : <p className="me__empty">Read a few stories and your favourite topics show up here.</p>}
        </section>

        {/* recently read */}
        {recent.length > 0 && (
          <section className="me__card" aria-label="Recently read">
            <div className="me__card-head"><h2 className="t-label-xs">Recently read</h2></div>
            <div className="me__recent">
              {recent.map((s) => (
                <Link key={s} prefetch={false} href={`/scrollbook/${s}`} className="me__recent-item">
                  <span className="me__recent-art">{stories[s].art && <img src={stories[s].art} alt="" loading="lazy" />}</span>
                  <span className="me__recent-title">{stories[s].title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* settings: interests + goal */}
        <section className="me__card" aria-label="Your interests">
          <div className="me__card-head"><h2 className="t-label-xs">Your interests</h2><Link href="/welcome?step=interests" className="me__edit t-label-xs">Edit</Link></div>
          {interests.length ? (
            <div className="me__chips">{interests.map((s) => <span key={s} className="me__chip">{topics.find((t) => t.slug === s)?.title ?? s}</span>)}</div>
          ) : <p className="me__empty">Pick a few topics and Discover deals them first. <Link href="/welcome?step=interests">Choose interests</Link></p>}
        </section>

        <section className="me__card" aria-label="Daily goal">
          <div className="me__card-head"><h2 className="t-label-xs">Daily goal</h2></div>
          <div className="me__seg" role="radiogroup" aria-label="Daily goal">
            {GOALS.map((g) => (
              <button key={g.n} type="button" role="radio" aria-checked={goal === g.n} className={goal === g.n ? "is-on" : ""} onClick={() => saveGoal(g.n)}>
                <b>{g.n}</b><span className="t-label-xs">{g.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* membership (demo): Plus on/off, so the paywall can be shown and lifted */}
        <section className={`me__card me__plus${plus ? " is-on" : ""}`} aria-label="Scrollbook Plus">
          <div className="me__card-head"><h2 className="t-label-xs">Scrollbook Plus</h2><span className="t-label-xs">{plus ? "Active · demo" : "Free plan"}</span></div>
          <p className="me__plus-main">{plus ? "Unlimited stories, audio, series and offline reading." : `${FREE_PER_DAY} full stories a day, unlimited cards. Plus is ${PLUS_PRICE.month}/month after a 7-day free trial.`}</p>
          <button type="button" className="me__plus-btn" onClick={() => setPlus(!plus)}>{plus ? "Turn off Plus (demo)" : "Try 7 days free"}</button>
        </section>

        {/* the rest of the site lives in the bottom bar's More sheet; here, just the tour */}
        <nav className="me__links" aria-label="More">
          <button type="button" className="me__link me__link--quiet" onClick={() => { resetOnboarding(); router.push("/welcome"); }}>Replay the welcome tour<ArrowIcon /></button>
        </nav>
      </div>
    </div>
  );
}
