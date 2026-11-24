"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadSeen, type Seen } from "@/lib/seen";

/* Library: your saved stories, curated collections, and every topic as a browsable cover grid.
   It shares Discover's memory (lib/seen.ts): covers you've never met carry a "New" badge, read ones a "Read" tag,
   recent skips get a second chance, and any topic or collection can be shuffled back into Discover. */

export type Story = { slug: string; title: string; art?: string; color: string };
export type Shelf = { slug: string; title: string; eyebrow: string; href: string; stories: string[] };

const SAVED_KEY = "scrollbook:saved";
const GRID_STEP = 12;

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const SaveIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" {...ic} /></svg>);
const BookIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M12 6.5C10.3 5.2 7.8 4.6 4.5 4.6v13c3.3 0 5.8.6 7.5 1.9 1.7-1.3 4.2-1.9 7.5-1.9v-13c-3.3 0-5.8.6-7.5 1.9zM12 6.5v13" {...ic} /></svg>);
const ShuffleIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M4 7h3.5c2 0 3 1 4.2 2.8l1.6 2.4C14.5 14 15.5 15 17.5 15H20M17 12l3 3-3 3M4 17h3.5c1.3 0 2.2-.4 3-1.2M13.5 8.2C14.3 7.4 15.2 7 16.5 7H20M17 4l3 3-3 3" {...ic} /></svg>);
const ArrowIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" {...ic} /></svg>);

export default function LibraryView({ stories, collections, topics }: { stories: Record<string, Story>; collections: Shelf[]; topics: Shelf[] }) {
  const [saved, setSaved] = useState<string[] | null>(null);
  const [topic, setTopic] = useState(topics[0]?.slug);
  const [shown, setShown] = useState(GRID_STEP);
  const [view, setView] = useState<"browse" | "saved">("browse");
  const [seen, setSeen] = useState<Seen | null>(null);
  useEffect(() => setSeen(loadSeen()), []);
  const mark = (slug: string): "new" | "read" | undefined => (!seen ? undefined : !seen[slug] ? "new" : seen[slug].s === "read" ? "read" : undefined);
  const skipped = seen ? Object.entries(seen).filter(([slug, v]) => v.s === "skip" && stories[slug]).sort((a, b) => b[1].t - a[1].t).slice(0, 12).map(([slug]) => stories[slug]) : [];

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")); } catch { setSaved([]); }
  }, []);
  useEffect(() => {
    setShown(GRID_STEP);
    // keep the chosen topic pill in view inside its scrolling row (without moving the page)
    const pill = document.querySelector<HTMLElement>(`.lib__pill[data-slug="${topic}"]`);
    const row = pill?.parentElement;
    if (pill && row) row.scrollTo({ left: pill.offsetLeft - row.clientWidth / 2 + pill.clientWidth / 2, behavior: "smooth" });
  }, [topic]);

  const current = topics.find((t) => t.slug === topic) ?? topics[0];
  const grid = useMemo(() => (current?.stories ?? []).map((s) => stories[s]).filter(Boolean), [current, stories]);
  const savedStories = (saved ?? []).map((s) => stories[s]).filter(Boolean).reverse(); // newest first

  return (
    <main id="main" className="lib" data-theme="light-fill">
      {/* page bar, same pattern as the Episodes page: round icon, serif title, two small toggles */}
      <div className="lib__bar">
        <span className="lib__bar-icon" aria-hidden><BookIcon /></span>
        <h1 className="lib__bar-title">Library</h1>
        <div className="lib__tabs" role="group" aria-label="View">
          <button type="button" className="filter-btn" aria-pressed={view === "browse"} onClick={() => setView("browse")}>browse</button>
          <button type="button" className="filter-btn" aria-pressed={view === "saved"} onClick={() => setView("saved")}>saved{saved?.length ? ` ${saved.length}` : ""}</button>
        </div>
      </div>

      {view === "saved" ? (
        <section className="lib__section lib__section--first" aria-label="Saved stories">
          {saved === null ? null : savedStories.length ? (
            <div className="lib__grid">{savedStories.map((s) => <Tile key={s.slug} s={s} mark={mark(s.slug)} />)}</div>
          ) : <EmptySaved />}
        </section>
      ) : (<>
      {/* Saved */}
      <section className="lib__section lib__section--first" aria-labelledby="lib-saved">
        <div className="lib__row-head">
          <h2 id="lib-saved" className="lib__h">Saved</h2>
          {!!savedStories.length && <span className="t-label-xs lib__count">{savedStories.length} {savedStories.length === 1 ? "story" : "stories"}</span>}
        </div>
        {saved === null ? (
          <div className="lib__rail" aria-hidden><div className="lib__tile lib__tile--ghost" /><div className="lib__tile lib__tile--ghost" /><div className="lib__tile lib__tile--ghost" /></div>
        ) : savedStories.length ? (
          <div className="lib__rail">{savedStories.map((s) => <Tile key={s.slug} s={s} mark={mark(s.slug)} />)}</div>
        ) : (
          <EmptySaved />
        )}
      </section>

      {/* Skipped recently: a second chance for quick swipes */}
      {!!skipped.length && (
        <section className="lib__section" aria-labelledby="lib-skipped">
          <div className="lib__row-head">
            <h2 id="lib-skipped" className="lib__h">Skipped recently</h2>
            <span className="t-label-xs lib__count">Second look?</span>
          </div>
          <div className="lib__rail">{skipped.map((st) => <Tile key={st.slug} s={st} />)}</div>
        </section>
      )}

      {/* Collections */}
      <section className="lib__section" aria-labelledby="lib-collections">
        <div className="lib__row-head"><h2 id="lib-collections" className="lib__h">Collections</h2></div>
        <div className="lib__rail lib__rail--wide">
          {collections.map((c) => {
            const covers = c.stories.map((s) => stories[s]).filter(Boolean).slice(0, 3);
            return (
              <div key={c.slug} className="lib__shelf">
              <Link href={c.href} className="lib__shelf-link">
                <span className="lib__stack" aria-hidden>
                  {covers.map((s, i) => (
                    <span key={s.slug} className="lib__stack-card" style={{ ["--i" as string]: i, background: s.color }}>
                      {s.art && <img src={s.art} alt="" loading="lazy" />}
                    </span>
                  ))}
                </span>
                <span className="t-label-xs lib__shelf-eyebrow">{c.eyebrow} · {c.stories.length}</span>
                <span className="lib__shelf-title">{c.title}</span>
              </Link>
              <Link href={`/?c=${c.slug}`} className="lib__shuffle lib__shuffle--sm" aria-label={`Shuffle ${c.title} in Discover`}><ShuffleIcon />Shuffle</Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Topics */}
      <section className="lib__section" aria-labelledby="lib-topics">
        <div className="lib__row-head">
          <h2 id="lib-topics" className="lib__h">Browse by topic</h2>
          {current && <Link href={`/?c=${current.slug}`} className="lib__shuffle"><ShuffleIcon />Shuffle {current.title}</Link>}
        </div>
        <div className="lib__pills" role="tablist" aria-label="Topics">
          {topics.map((t) => (
            <button key={t.slug} data-slug={t.slug} type="button" role="tab" aria-selected={t.slug === topic} className="lib__pill" onClick={() => setTopic(t.slug)}>
              {t.title}<span className="lib__pill-n">{t.stories.length}</span>
            </button>
          ))}
        </div>
        <div className="lib__grid" role="tabpanel" aria-label={current?.title}>
          {grid.slice(0, shown).map((s) => <Tile key={s.slug} s={s} mark={mark(s.slug)} />)}
        </div>
        {grid.length > shown && (
          <button type="button" className="lib__more" onClick={() => setShown((n) => n + GRID_STEP)}>Show more {current?.title}</button>
        )}
      </section>
      </>)}
    </main>
  );
}

function EmptySaved() {
  return (
    <Link href="/" className="lib__empty">
      <span className="lib__empty-icon"><SaveIcon /></span>
      <span><b>Nothing saved yet.</b> Swipe right on a story in Discover and it lands here.</span>
      <ArrowIcon />
    </Link>
  );
}

function Tile({ s, mark }: { s: Story; mark?: "new" | "read" }) {
  return (
    <Link href={`/scrollbook/${s.slug}`} className="lib__tile">
      <span className="lib__tile-art" style={{ background: s.color }}>
        {mark && <span className={`lib__badge lib__badge--${mark}`}>{mark === "new" ? "New" : "Read"}</span>}
        {s.art ? <img src={s.art} alt="" loading="lazy" /> : <span className="lib__tile-fallback">{s.title}</span>}
      </span>
      <span className="lib__tile-title">{s.title}</span>
    </Link>
  );
}
