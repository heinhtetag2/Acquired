"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MenuIcon } from "../Icons";
import { loadSeen, type Seen } from "@/lib/seen";
import { allThreads, onNotesChange, type SlugThread } from "@/lib/notes";
import { track } from "@/lib/navTrail";
import ShelfNotes from "./ShelfNotes";

/* Shelf: everything you've saved, to come back to (same layout as the classic Episodes list).
   Real saves (from Discover) come first, newest first. Demo mode fills the rest of the shelf as if every story
   were already saved, with spread-out "saved … ago" dates, so the page is never empty.
   Old unread saves get a gentle "Revisit" nudge; stories you've opened are tagged "Read". */

export type ShelfItem = { slug: string; title: string; art?: string; topic: string; topicSlug?: string; teaser?: string; min: number };

const SAVED_KEY = "scrollbook:saved";
const HIDDEN_KEY = "scrollbook:shelf-hidden"; // demo items you've taken off the shelf
const VIEW_KEY = "scrollbook:shelf-view";
const DAY = 86_400_000;
const DEMO = true; // pretend everything is already saved (demo); set false to show only real saves

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ArrowIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" {...ic} /></svg>);
const SaveIcon = ({ filled }: { filled?: boolean }) => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" {...ic} fill={filled ? "currentColor" : "none"} /></svg>);

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/** Stable pseudo "saved N days ago" for demo items (1–120 days), from the slug. */
const demoDaysAgo = (slug: string) => { let h = 0; for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 1 + (h % 120); };
const ago = (ms: number) => {
  const d = Math.max(0, Math.round((Date.now() - ms) / DAY));
  if (d === 0) return "Saved today";
  if (d === 1) return "Saved yesterday";
  if (d < 14) return `Saved ${d} days ago`;
  if (d < 60) return `Saved ${Math.round(d / 7)} weeks ago`;
  return `Saved ${Math.round(d / 30)} months ago`;
};

export default function ShelfPage({ items, topics }: { items: ShelfItem[]; topics: { slug: string; title: string }[] }) {
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [seen, setSeen] = useState<Seen>({});
  const [skim, setSkim] = useState(false); // view only: full rows (browse) or compact grid (skim), like the classic list
  const [topic, setTopic] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [tab, setTab] = useState<"stories" | "notes">("stories"); // ?tab=notes opens your highlights + comments
  const [threads, setThreads] = useState<SlugThread[]>([]);

  useEffect(() => { setSaved(read(SAVED_KEY, [])); setHidden(read(HIDDEN_KEY, [])); setSeen(loadSeen()); setSkim(read<string>(VIEW_KEY, "browse") === "skim");
    setThreads(allThreads()); if (new URLSearchParams(location.search).get("tab") === "notes") setTab("notes"); setReady(true); }, []);
  useEffect(() => onNotesChange(() => setThreads(allThreads())), []);
  // keep the tab in the address, so a story's Back button returns to the same tab
  const pickTab = (t: "stories" | "notes") => {
    setTab(t); setTopic(null);
    const url = t === "notes" ? "/episodes?tab=notes" : "/episodes";
    history.replaceState(history.state, "", url); track(url);
  };
  useEffect(() => { if (ready) write(VIEW_KEY, skim ? "skim" : "browse"); }, [skim, ready]);
  useEffect(() => {
    if (!sidebar) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebar(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebar]);

  const bySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);
  // shelf = real saves (newest first) + demo fill; each with the time it was "saved"
  const shelf = useMemo(() => {
    const real = [...saved].reverse().filter((s) => !hidden.includes(s)).map((s) => bySlug.get(s)).filter((x): x is ShelfItem => !!x)
      .map((i) => ({ ...i, at: seen[i.slug]?.t ?? Date.now(), real: true }));
    const have = new Set(real.map((r) => r.slug));
    const demo = DEMO ? items.filter((i) => !have.has(i.slug) && !hidden.includes(i.slug))
      .map((i) => ({ ...i, at: Date.now() - demoDaysAgo(i.slug) * DAY, real: false }))
      .sort((a, b) => b.at - a.at) : [];
    return [...real, ...demo];
  }, [saved, hidden, seen, items, bySlug]);

  const isRead = (slug: string) => seen[slug]?.s === "read";
  const list = shelf.filter((i) => !topic || i.topicSlug === topic);
  const counts = useMemo(() => { const m = new Map<string, number>(); shelf.forEach((i) => i.topicSlug && m.set(i.topicSlug, (m.get(i.topicSlug) ?? 0) + 1)); return m; }, [shelf]);
  const topicTitle = topics.find((t) => t.slug === topic)?.title;
  const notes = tab === "notes";
  const noteCount = threads.filter((t) => bySlug.has(t.slug)).length;
  const heading = notes ? "Your notes" : topicTitle ? `Shelf · ${topicTitle}` : "Your shelf";

  // taking a story off the shelf: drop it from your saves and keep the demo fill from bringing it back
  const remove = (slug: string, real: boolean) => {
    if (real) { const s = saved.filter((x) => x !== slug); setSaved(s); write(SAVED_KEY, s); }
    const h = [...hidden, slug]; setHidden(h); write(HIDDEN_KEY, h);
  };

  const toggles = (
    <div className="pl-toggles" role="group" aria-label="View">
      <button className="filter-btn" aria-pressed={!skim} onClick={() => setSkim(false)}>browse</button>
      <button className="filter-btn" aria-pressed={skim} onClick={() => setSkim(true)}>skim</button>
    </div>
  );

  return (
    <div className="pl shelf">
      <div className="pl-nav-band" data-theme="playlist" aria-hidden />
      <div className="pl-bar">
        <button className="icon-btn" aria-expanded={sidebar} aria-controls="shelf-topics" onClick={() => setSidebar(!sidebar)}><MenuIcon /><span className="sr-only">Filter by topic</span></button>
        <div className="pl-bar__title">{heading}</div>
        {!notes && toggles}
      </div>

      {/* ☰ = filter your shelf by topic */}
      <div className={`pl-sidebar-pop ${sidebar ? "is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && setSidebar(false)}>
        <nav id="shelf-topics" className="pl-sidebar" aria-label="Filter shelf by topic">
          <div className="pl-group">
            <div className="pl-group__head t-label">Topics on your shelf</div>
            <button type="button" className="pl-link" aria-current={!topic ? "page" : undefined} onClick={() => { setTopic(null); setSidebar(false); }}>everything <span className="shelf__n">{shelf.length}</span></button>
            {topics.filter((t) => counts.get(t.slug)).map((t) => (
              <button key={t.slug} type="button" className="pl-link" aria-current={topic === t.slug ? "page" : undefined} onClick={() => { setTopic(t.slug); setSidebar(false); }}>
                {t.title} <span className="shelf__n">{counts.get(t.slug)}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="pl-main">
        <div className="spacer-xl only-desktop-xl" />
        <div className="pl-head">
          <h1 className="t-h2">{heading}</h1>
          {!notes && toggles}
        </div>
        <div className="shelf__tabs" role="tablist" aria-label="Shelf">
          <button type="button" role="tab" aria-selected={!notes} className="shelf__tab" onClick={() => pickTab("stories")}>Stories{ready && <span>{shelf.length}</span>}</button>
          <button type="button" role="tab" aria-selected={notes} className="shelf__tab" onClick={() => pickTab("notes")}>Notes{ready && <span>{noteCount}</span>}</button>
        </div>
        {ready && notes && <ShelfNotes threads={threads} bySlug={bySlug} />}
        {ready && !notes && !list.length && <p className="pl-empty t-body">Nothing here yet. Swipe right in Discover to save a story.</p>}
        <div className={`pl-list${skim ? " is-skim" : ""}`} hidden={notes}>
          {ready && !notes && list.map((i) => {
            const done = isRead(i.slug);
            // "Revisit?": saved a while ago and never opened. Kept rare so it means something:
            // real saves after 3 weeks; demo items only a few (1 in 6) of the older ones
            const old = !done && Date.now() - i.at > 21 * DAY;
            const stale = old && (i.real || demoDaysAgo(i.slug + "~") % 6 === 0);
            return (
              <article key={i.slug} className={`pl-row shelf__row${done ? " is-read" : ""}`}>
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
                      <span>{ago(i.at)}</span>
                      {done && <span className="shelf__tag shelf__tag--read">Read</span>}
                      {stale && <span className="shelf__tag shelf__tag--revisit">Revisit?</span>}
                    </div>
                  </div>
                </div>
                <div className="shelf__acts">
                  <button type="button" className="shelf__unsave" onClick={() => remove(i.slug, i.real)} aria-label={`Remove ${i.title} from your shelf`}><SaveIcon filled /></button>
                  <Link prefetch={false} className="pl-play" href={`/scrollbook/${i.slug}`} aria-label={`Read ${i.title}`}><ArrowIcon /></Link>
                </div>
              </article>
            );
          })}
        </div>
        <div className="spacer-base" />
      </div>
    </div>
  );
}
