"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate, seasonLabel, site } from "@/lib/site";
import searchIndex from "@/content/search-index.json";
import { SearchIcon } from "./Icons";

// Slim client-side index (content/search-index.json): title, date, season code, art, plus filter names for matching.
type Hit = { slug: string; title: string; date: string; seasonCode?: string; thumb?: string; cover?: string; color?: string; tags: string };
const INDEX = searchIndex as Hit[];

// Live constants (search-nav.v1.js): DEBOUNCE_MS 180, MIN_QUERY 2, MAX_RESULTS 6.
const DEBOUNCE_MS = 180, MIN_QUERY = 2, MAX_RESULTS = 6;
const RECENT = 4;
const FEATURED = [
  { label: "Must-Listen", href: "/features/must-listen" }, { label: "Niche Gems", href: "/features/niche-gems" },
  { label: "Interviews", href: "/features/interviews" }, { label: "view all", href: "/episodes" },
];
const INDUSTRY_SLUGS = ["software", "luxury", "finance", "social-media", "vc-investing", "sports", "fintech", "semiconductors"];
const INDUSTRIES = INDUSTRY_SLUGS.map((s) => site.sidebar.flatMap((g) => g.links).find((l) => l.href === `/industry/${s}`)!).filter(Boolean).map((l) => ({ href: l.href, title: l.label }));
const RECENT_HITS = [...site.latest.map((s) => INDEX.find((h) => h.slug === s)!).filter(Boolean), ...INDEX].filter((h, i, a) => a.indexOf(h) === i).slice(0, RECENT);

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
    <Link href={`/episodes/${ep.slug}`} className={`search-item ${active ? "is-active" : ""}`} onClick={onPick}>
      <div className="search-item__art" style={{ background: ep.color }}>{art && <img src={art} alt="" loading="lazy" />}</div>
      <div style={{ minWidth: 0 }}>
        <div className="search-item__title">{ep.title}</div>
        <div className="search-item__desc">{[seasonLabel(ep.seasonCode), formatDate(ep.date)].filter(Boolean).join(" · ")}</div>
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

  const close = () => { setOpen(false); input.current?.blur(); };
  const pick = () => { setOpen(false); setQ(""); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) {
      if (e.key === "Enter" && q.trim()) { e.preventDefault(); pick(); router.push(`/episodes?q=${encodeURIComponent(q.trim())}`); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) { pick(); router.push(`/episodes/${results[active].slug}`); }
      else { pick(); router.push(`/episodes?q=${encodeURIComponent(q.trim())}`); }
    }
  };

  const view = !open ? "closed" : query && results.length ? "results" : query ? "empty" : "initial";

  return (
    <>
      <div className={`search-bg ${open ? "is-open" : ""}`} onClick={close} aria-hidden />
      <div className={`search-section ${open ? "is-open" : ""}`} role={open ? "dialog" : undefined} aria-label={open ? "Search episodes" : undefined}>
        <form className="search-bar" role="search" onSubmit={(e) => e.preventDefault()} onClick={() => { if (!open) { setOpen(true); input.current?.focus(); } }}>
          <SearchIcon className="search-bar__icon search-bar__icon--lead" />
          <label htmlFor="nav-search" className="sr-only">Search episodes</label>
          <input ref={input} id="nav-search" className="search-input" type="search" placeholder="Search Episodes" autoComplete="off" value={q}
            onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
            role="combobox" aria-expanded={view === "results"} aria-controls="search-results" aria-activedescendant={active >= 0 ? `search-r-${active}` : undefined} />
          <SearchIcon className="search-bar__icon search-bar__icon--trail" />
          <button type="button" className="search-cancel" onClick={(e) => { e.stopPropagation(); close(); }}>cancel</button>
        </form>
        <div className="search-body" hidden={!open}>
          <div className="spacer-xs" />
          {view === "initial" && (
            <div className="search-initial">
              <div className="search-label">recent releases</div>
              {RECENT_HITS.map((ep) => <Item key={ep.slug} ep={ep} onPick={pick} />)}
              <div className="spacer-sm" /><div className="search-rule" /><div className="spacer-sm" />
              <div className="search-label">featured playlists</div>
              <div className="search-grid">{FEATURED.map((f) => <Link key={f.href} href={f.href} className="search-chip" onClick={pick}>{f.label}</Link>)}</div>
              <div className="spacer-xs" />
              <div className="search-label">industry</div>
              <div className="search-grid">{INDUSTRIES.map((f) => <Link key={f.href} href={f.href} className="search-chip" onClick={pick}>{f.title}</Link>)}</div>
            </div>
          )}
          {view === "results" && (
            <div id="search-results" className="search-results" role="listbox">
              {results.map((ep, i) => <div key={ep.slug} id={`search-r-${i}`} role="option" aria-selected={i === active}><Item ep={ep} active={i === active} onPick={pick} /></div>)}
            </div>
          )}
          {view === "empty" && <div className="search-empty">No episodes found.</div>}
          <div style={{ height: 20 }} />
        </div>
      </div>
    </>
  );
}
