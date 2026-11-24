"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import filters from "@/content/filters.json";
import searchIndex from "@/content/search-index.json";
import scrollbookData from "@/content/scrollbook.json";
import { SearchIcon } from "./Icons";

// Slim client-side index (content/search-index.json): title, date, season code, art, plus filter names for matching.
type Hit = { slug: string; title: string; date: string; seasonCode?: string; thumb?: string; cover?: string; color?: string; tags: string; href?: string; label?: string };
const EPISODES = searchIndex as Hit[];
// Every hit is a Scrollbook story: it opens the story page, shows the book's own title where there is one
// (still matched by the original title too), and is labelled by topic + reading time instead of season + date.
const BOOK_TITLES = scrollbookData.books as Record<string, { title?: string }>;
const CURATED = new Map(scrollbookData.deck.map((d) => [d.slug, d]));
const INDUSTRY = filters.filter((f) => f.group === "industry");
const TOPIC_OF = new Map<string, string>();
for (const f of INDUSTRY) for (const s of f.episodes) if (!TOPIC_OF.has(s)) TOPIC_OF.set(s, f.title);
const INDEX: Hit[] = EPISODES.map((h) => {
  const book = BOOK_TITLES[h.slug]?.title;
  const d = CURATED.get(h.slug);
  return { ...h, title: book ?? h.title, tags: book ? `${h.tags} ${h.title.toLowerCase()}` : h.tags,
    label: `${d?.topic ?? TOPIC_OF.get(h.slug) ?? "Story"} · ${d?.min ?? 7} min read` };
});
const BY_SLUG = new Map(INDEX.map((h) => [h.slug, h]));
const hrefOf = (h: Hit) => h.href ?? `/scrollbook/${h.slug}`;

// Live constants (search-nav.v1.js): DEBOUNCE_MS 180, MIN_QUERY 2, MAX_RESULTS 6.
const DEBOUNCE_MS = 180, MIN_QUERY = 2, MAX_RESULTS = 6;
const RECENT = 4;
// collections shuffle into Discover (/?c=…); reader-friendly names for the curated lists
const COLLECTIONS = [
  { label: "Must-reads", href: "/?c=must-listen" }, { label: "Hidden gems", href: "/?c=niche-gems" },
  { label: "Conversations", href: "/?c=interviews" }, { label: "Library", href: "/library" },
];
const TOPIC_SLUGS = ["software", "luxury", "finance", "social-media", "vc-investing", "sports", "fintech", "semiconductors"];
const TOPICS = TOPIC_SLUGS.map((s) => INDUSTRY.find((f) => f.slug === s)).filter((f) => !!f).map((f) => ({ href: `/?c=${f.slug}`, title: f.title }));
// when nothing is saved yet: the start of the Discover deck
const PICKS = scrollbookData.deck.slice(0, RECENT).map((d) => BY_SLUG.get(d.slug)).filter((h): h is Hit => !!h);

function search(q: string): Hit[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return INDEX
    .map((e) => {
      const title = e.title.toLowerCase(), tags = e.tags;
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 4;
        else if (tags.includes(t)) score += 2; else return null;
      }
      return { e, score };
    })
    .filter((x): x is { e: Hit; score: number } => !!x)
    .sort((a, b) => b.score - a.score || b.e.date.localeCompare(a.e.date))
    .slice(0, MAX_RESULTS).map((x) => x.e);
}

function Item({ ep, active, onPick }: { ep: Hit; active?: boolean; onPick: () => void }) {
  const art = ep.thumb ?? ep.cover;
  return (
    <Link href={hrefOf(ep)} className={`search-item ${active ? "is-active" : ""}`} onClick={onPick}>
      <div className="search-item__art" style={{ background: ep.color }}>{art && <img src={art} alt="" loading="lazy" />}</div>
      <div style={{ minWidth: 0 }}>
        <div className="search-item__title">{ep.title}</div>
        <div className="search-item__desc">{ep.label}</div>
      </div>
    </Link>
  );
}

export default function SearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  // your latest saves (newest first), read each time the panel opens
  const [shelf, setShelf] = useState<Hit[]>([]);
  useEffect(() => {
    if (!open) return;
    try { setShelf((JSON.parse(localStorage.getItem("scrollbook:saved") || "[]") as string[]).reverse().map((s) => BY_SLUG.get(s)).filter((h): h is Hit => !!h).slice(0, RECENT)); } catch { setShelf([]); }
  }, [open]);
  const input = useRef<HTMLInputElement>(null);
  const scrollY = useRef(0);

  // debounce
  useEffect(() => {
    const v = q.trim();
    if (v.length < MIN_QUERY) { setQuery(""); setActive(-1); return; }
    const t = setTimeout(() => { setQuery(v); setActive(-1); }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);
  const results = useMemo(() => (query ? search(query) : []), [query]);

  // body scroll lock (live: body position fixed + restore scrollY)
  useEffect(() => {
    if (!open) return;
    scrollY.current = window.scrollY;
    const b = document.body.style;
    Object.assign(b, { position: "fixed", top: `-${scrollY.current}px`, left: "0", right: "0" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      Object.assign(b, { position: "", top: "", left: "", right: "" });
      window.scrollTo(0, scrollY.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // the mobile bottom bar's search button opens this same panel
  useEffect(() => {
    // flushSync renders the open panel before focusing, so the phone keyboard opens inside the same tap
    const onOpen = () => { flushSync(() => setOpen(true)); input.current?.focus(); };
    window.addEventListener("sb:search-open", onOpen);
    return () => window.removeEventListener("sb:search-open", onOpen);
  }, []);

  const close = () => { setOpen(false); input.current?.blur(); };
  const pick = () => { setOpen(false); setQ(""); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) {
      if (e.key === "Enter") e.preventDefault(); // nothing to open
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) { pick(); router.push(hrefOf(results[active])); }
      else { pick(); router.push(hrefOf(results[0])); } // Enter opens the top match
    }
  };

  const view = !open ? "closed" : query && results.length ? "results" : query ? "empty" : "initial";

  return (
    <>
      <div className={`search-bg ${open ? "is-open" : ""}`} onClick={close} aria-hidden />
      <div className={`search-section ${open ? "is-open" : ""}`} role={open ? "dialog" : undefined} aria-label={open ? "Search stories" : undefined}>
        <form className="search-bar" role="search" onSubmit={(e) => e.preventDefault()} onClick={() => { if (!open) { flushSync(() => setOpen(true)); input.current?.focus(); } }}>
          <SearchIcon className="search-bar__icon search-bar__icon--lead" />
          <label htmlFor="nav-search" className="sr-only">Search stories</label>
          <input ref={input} id="nav-search" className="search-input" type="search" placeholder="Search stories" autoComplete="off" value={q}
            onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
            role="combobox" aria-expanded={view === "results"} aria-controls="search-results" aria-activedescendant={active >= 0 ? `search-r-${active}` : undefined} />
          <SearchIcon className="search-bar__icon search-bar__icon--trail" />
          <button type="button" className="search-cancel" onClick={(e) => { e.stopPropagation(); close(); }}>cancel</button>
        </form>
        <div className="search-body" hidden={!open}>
          <div className="spacer-xs" />
          {view === "initial" && (
            <div className="search-initial">
              <div className="search-label">{shelf.length ? "pick up where you left off" : "today's picks"}</div>
              {(shelf.length ? shelf : PICKS).map((ep) => <Item key={ep.slug} ep={ep} onPick={pick} />)}
              <div className="spacer-sm" /><div className="search-rule" /><div className="spacer-sm" />
              <div className="search-label">collections</div>
              <div className="search-grid">{COLLECTIONS.map((f) => <Link key={f.href} href={f.href} className="search-chip" onClick={pick}>{f.label}</Link>)}</div>
              <div className="spacer-xs" />
              <div className="search-label">topics</div>
              <div className="search-grid">{TOPICS.map((f) => <Link key={f.href} href={f.href} className="search-chip" onClick={pick}>{f.title}</Link>)}</div>
            </div>
          )}
          {view === "results" && (
            <div id="search-results" className="search-results" role="listbox">
              {results.map((ep, i) => <div key={hrefOf(ep)} id={`search-r-${i}`} role="option" aria-selected={i === active}><Item ep={ep} active={i === active} onPick={pick} /></div>)}
            </div>
          )}
          {view === "empty" && <div className="search-empty">No stories found.</div>}
          <div style={{ height: 20 }} />
        </div>
      </div>
    </>
  );
}
