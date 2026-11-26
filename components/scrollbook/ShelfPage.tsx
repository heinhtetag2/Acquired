"use client";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { loadSeen, type Seen } from "@/lib/seen";
import { allThreads, onNotesChange, type SlugThread } from "@/lib/notes";
import { track } from "@/lib/navTrail";
import { loadSaved, setSaved } from "@/lib/saved";
import ShelfNotes from "./ShelfNotes";

/* Shelf: the one page that holds only what you chose to keep (Discover shuffles; the Shelf remembers).
   saved: every story you kept, newest save first (opened ones are tagged "Read"; saving from a story's own page
          counts as opening it, so reads must never hide a save). Old unread saves get a gentle "Revisit?" nudge.
   notes: your highlights and comments.
   read:  every story you've opened, newest first, so you can find "that one about Rolex" again. */

export type ShelfItem = { slug: string; title: string; art?: string; topic: string; topicSlug?: string; teaser?: string; min: number };

const DAY = 86_400_000;
type Tab = "saved" | "notes" | "read";
const TABS: Tab[] = ["saved", "notes", "read"];
const SHOWN: Tab[] = ["saved", "read"]; // notes isn't a tab: it opens from the profile's Highlights / Comments (?tab=notes)

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ArrowIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" {...ic} /></svg>);
// sliders: "narrow this list down" (a ☰ reads as a site menu, so nobody guessed it filtered)
const FilterIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...ic} /><circle cx="15" cy="7" r="2" {...ic} /><circle cx="9" cy="17" r="2" {...ic} /></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M7 7l10 10M17 7 7 17" {...ic} /></svg>);
const SaveIcon = ({ filled }: { filled?: boolean }) => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" {...ic} fill={filled ? "currentColor" : "none"} /></svg>);

/** Which time group a story sits under on the Shelf: when you saved it (Saved tab) or read it (Read tab). */
function whenOf(ms: number) {
  const start = new Date(); start.setHours(0, 0, 0, 0); // midnight today
  const t = start.getTime();
  if (ms >= t) return "Today";
  if (ms >= t - DAY) return "Yesterday";
  if (ms >= t - 6 * DAY) return "This week";
  if (ms >= t - 29 * DAY) return "This month";
  return "Older";
}
const ago = (verb: string, ms: number) => {
  const d = Math.max(0, Math.round((Date.now() - ms) / DAY));
  if (d === 0) return `${verb} today`;
  if (d === 1) return `${verb} yesterday`;
  if (d < 14) return `${verb} ${d} days ago`;
  if (d < 60) return `${verb} ${Math.round(d / 7)} weeks ago`;
  return `${verb} ${Math.round(d / 30)} months ago`;
};

export default function ShelfPage({ items, topics }: { items: ShelfItem[]; topics: { slug: string; title: string }[] }) {
  const [ready, setReady] = useState(false);
  const [saved, setSavedList] = useState<string[]>([]);
  const [seen, setSeen] = useState<Seen>({});
  const [picked, setPicked] = useState<string[]>([]); // categories to show (several at once); none = everything
  const togglePick = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));
  const [sidebar, setSidebar] = useState(false);
  const [tab, setTab] = useState<Tab>("saved"); // ?tab=notes / ?tab=read open those tabs
  const [threads, setThreads] = useState<SlugThread[]>([]);

  useEffect(() => {
    const sync = () => { setSavedList(loadSaved()); setSeen(loadSeen()); };
    sync(); setThreads(allThreads());
    const t = new URLSearchParams(location.search).get("tab") as Tab | null;
    if (t && TABS.includes(t)) setTab(t);
    setReady(true);
    window.addEventListener("sb:saved", sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener("sb:saved", sync); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => onNotesChange(() => setThreads(allThreads())), []);
  // keep the tab in the address, so a story's Back button returns to the same tab
  const pickTab = (t: Tab) => {
    setTab(t); setPicked([]);
    const url = t === "saved" ? "/shelf" : `/shelf?tab=${t}`;
    history.replaceState(history.state, "", url); track(url);
  };
  useEffect(() => {
    if (!sidebar) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebar(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebar]);

  const bySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);
  // saved: everything you kept, newest save first ("at" = when it was saved, or last opened)
  const savedItems = useMemo(() => [...saved].reverse().map((s) => bySlug.get(s))
    .filter((x): x is ShelfItem => !!x).map((i) => ({ ...i, at: seen[i.slug]?.t ?? Date.now() })), [saved, seen, bySlug]);
  // read: everything you've opened, newest first ("at" = when you read it)
  const readItems = useMemo(() => Object.entries(seen).filter(([, v]) => v.s === "read").sort((a, b) => b[1].t - a[1].t)
    .map(([s, v]) => { const i = bySlug.get(s); return i && { ...i, at: v.t }; }).filter((x): x is ShelfItem & { at: number } => !!x), [seen, bySlug]);
  const shelf = tab === "read" ? readItems : savedItems;
  // newest first, so the time headings (Today, Yesterday, This week…) each appear once
  const list = shelf.filter((i) => !picked.length || (!!i.topicSlug && picked.includes(i.topicSlug))).sort((a, b) => b.at - a.at);
  const counts = useMemo(() => { const m = new Map<string, number>(); shelf.forEach((i) => i.topicSlug && m.set(i.topicSlug, (m.get(i.topicSlug) ?? 0) + 1)); return m; }, [shelf]);
  const titleOf = (slug: string) => topics.find((t) => t.slug === slug)?.title ?? slug;
  const notes = tab === "notes";
  const heading = notes ? "Your notes" : "Your shelf"; // stays put: the chips under the bar show any filter, the switch shows stories / notes

  const remove = (slug: string) => setSaved(slug, false); // take a story off the shelf

  // top-right switch: saved (read later) or read (what you've opened)
  const toggles = (
    <div className="pl-toggles" role="group" aria-label="Shelf">
      {SHOWN.map((t) => <button key={t} className="filter-btn" aria-pressed={tab === t} onClick={() => pickTab(t)}>{t}</button>)}
    </div>
  );

  return (
    <div className="pl shelf">
      <div className="pl-nav-band" data-theme="dark" aria-hidden />
      <div className="pl-bar">
        <button hidden={notes || !shelf.length} className={`icon-btn shelf__filter${picked.length ? " is-on" : ""}`} aria-expanded={sidebar} aria-controls="shelf-topics" onClick={() => setSidebar(!sidebar)}>
          <FilterIcon /><span className="sr-only">{picked.length ? `Filtered by ${picked.map(titleOf).join(", ")}. Change filter` : "Filter by category"}</span>
        </button>
        <div className="pl-bar__title">{heading}</div>
        {toggles}
      </div>

      {/* filter by category: a bottom sheet on phones, the side panel on wider screens */}
      <div className={`pl-sidebar-pop ${sidebar ? "is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && setSidebar(false)}>
        <nav id="shelf-topics" className="pl-sidebar" aria-label="Filter shelf by topic">
          {/* tick as many categories as you like; the list updates as you go, Show closes */}
          <div className="sf">
            <div className="sf__head">
              <span className="t-label-xs">Filter by category</span>
              {picked.length > 0 && <button type="button" className="sf__clear t-label-xs" onClick={() => setPicked([])}>Clear</button>}
            </div>
            <div className="sf__grid" role="group" aria-label="Categories">
              {topics.filter((t) => counts.get(t.slug)).map((t) => {
                const on = picked.includes(t.slug);
                return (
                  <button key={t.slug} type="button" className="sf__opt" aria-pressed={on} onClick={() => togglePick(t.slug)}>
                    <span className="sf__name">{t.title}</span><span className="sf__n">{counts.get(t.slug)}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="sf__show" onClick={() => setSidebar(false)}>
              {picked.length ? `Show ${list.length} ${list.length === 1 ? "story" : "stories"}` : `Show all ${shelf.length} ${shelf.length === 1 ? "story" : "stories"}`}
            </button>
          </div>
        </nav>
      </div>

      <div className="pl-main">
        <div className="spacer-xl only-desktop-xl" />
        {/* the active filter, one tap to clear */}
        {picked.length > 0 && !notes && (
          <div className="shelf__active">
            {picked.map((slug) => (
              <button key={slug} type="button" className="shelf__active-chip t-label-xs" onClick={() => togglePick(slug)} aria-label={`Remove the ${titleOf(slug)} filter`}>{titleOf(slug)}<CloseIcon /></button>
            ))}
            <span className="t-label-xs">{list.length} {list.length === 1 ? "story" : "stories"}</span>
          </div>
        )}
        <div className="pl-head">
          <h1 className="t-h2">{heading}</h1>
          {toggles}
        </div>
        {ready && notes && <ShelfNotes threads={threads} bySlug={bySlug} />}
        {ready && !notes && !shelf.length && (
          <div className="shelf__empty">
            <p className="t-body">{tab === "read" ? "Stories you read show up here, so you can find them again." : "Nothing saved yet. Swipe right on a story in Discover to keep it here."}</p>
            <Link href="/" className="shelf__cta t-label-xs">Go to Discover</Link>
          </div>
        )}
        <div className="pl-list" hidden={notes}>
          {ready && !notes && list.map((i, n) => {
            const when = whenOf(i.at);
            const newGroup = n === 0 || whenOf(list[n - 1].at) !== when;
            const done = tab === "read";
            const opened = seen[i.slug]?.s === "read";
            const stale = !done && !opened && Date.now() - i.at > 21 * DAY; // "Revisit?": saved 3+ weeks ago, still unread
            return (
              <Fragment key={i.slug}>
              {newGroup && <h2 className="shelf__when t-label-xs">{when}</h2>}
              <article className="pl-row shelf__row">
                <Link prefetch={false} href={`/scrollbook/${i.slug}`} className="pl-row__link"><span className="sr-only">{i.title}</span></Link>
                <div className="pl-art pl-art--desktop">{i.art && <img src={i.art} alt="" loading="lazy" />}</div>
                <div className="pl-body">
                  <div className="pl-headrow">
                    <div className="pl-art pl-art--mobile">{i.art && <img src={i.art} alt="" loading="lazy" />}</div>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="pl-title">{i.title}</h3>
                      <div className="pl-meta t-label shelf__meta">
                        <span>{i.topic} · {i.min} min read</span>
                      </div>
                    </div>
                  </div>
                  <div className="pl-extra">
                    {i.teaser && <p className="pl-desc t-body-140">{i.teaser}</p>}
                    <div className="shelf__status t-label-xs">
                      <span>{ago(done ? "Read" : "Saved", i.at)}</span>
                      {done && saved.includes(i.slug) && <span className="shelf__tag shelf__tag--read">Saved</span>}
                      {!done && opened && <span className="shelf__tag shelf__tag--read">Read</span>}
                      {stale && <span className="shelf__tag shelf__tag--revisit">Revisit?</span>}
                    </div>
                  </div>
                </div>
                <div className="shelf__acts">
                  {!done && <button type="button" className="shelf__unsave" onClick={() => remove(i.slug)} aria-label={`Remove ${i.title} from your shelf`}><SaveIcon filled /></button>}
                  <Link prefetch={false} className="pl-play" href={`/scrollbook/${i.slug}`} aria-label={`Read ${i.title}`}><ArrowIcon /></Link>
                </div>
              </article>
              </Fragment>
            );
          })}
        </div>
        <div className="spacer-base" />
      </div>
    </div>
  );
}
