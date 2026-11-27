"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import filters from "@/content/filters.json";
import searchIndex from "@/content/search-index.json";
import scrollbookData from "@/content/scrollbook.json";
import { SearchIcon } from "./Icons";
import { loadInterests } from "@/lib/profile";
import { deckImageReady, leftStoryPage, navigateWithTransition } from "@/lib/viewTransition";

// Slim client-side index (content/search-index.json): title, date, season code, art, plus filter names for matching.
type Hit = { slug: string; title: string; date: string; seasonCode?: string; thumb?: string; cover?: string; color?: string; tags: string; href?: string; label?: string };
const EPISODES = searchIndex as Hit[];
// Every hit is a Scrollbook story: it opens the story page, shows the book's own title where there is one
// (still matched by the original title too), and is labelled by topic + reading time instead of season + date.
const BOOK_TITLES = scrollbookData.books as Record<string, { title?: string }>;
const CURATED = new Map(scrollbookData.deck.map((d) => [d.slug, d]));
const INDUSTRY = filters.filter((f) => f.group === "category"); // the 8 broad categories (Tech, Money, …)
const TOPIC_OF = new Map<string, string>();
for (const f of INDUSTRY) for (const s of f.episodes) if (!TOPIC_OF.has(s)) TOPIC_OF.set(s, f.title);
const SHORT = (scrollbookData as unknown as { cardTitles?: Record<string, string> }).cardTitles ?? {};
const INDEX: Hit[] = EPISODES.map((h) => {
  const book = SHORT[h.slug] ?? BOOK_TITLES[h.slug]?.title;
  const d = CURATED.get(h.slug);
  return { ...h, title: book ?? h.title, tags: book ? `${h.tags} ${h.title.toLowerCase()}` : h.tags,
    label: `${d?.topic ?? TOPIC_OF.get(h.slug) ?? "Story"} · ${d?.min ?? 7} min read` };
});
// Scrollbook-only stories (e.g. Avengers: Doomsday, iPhone 17 Pro) aren't in the episode index: add them
const STORIES = (scrollbookData as unknown as { stories?: Record<string, { title: string; date: string; image?: string; cover?: string; color?: string } & Record<string, unknown>> }).stories ?? {};
for (const [slug, st] of Object.entries(STORIES)) {
  if (INDEX.some((h) => h.slug === slug)) continue;
  const d = CURATED.get(slug), topic = d?.topic ?? TOPIC_OF.get(slug) ?? "Story";
  INDEX.unshift({ slug, title: st.title, date: st.date, thumb: st.image ?? st.cover, color: st.color, tags: `${st.title.toLowerCase()} ${topic.toLowerCase()}`, label: `${topic} · ${d?.min ?? 7} min read` });
}
// also match what's inside a story: its subtitle, description, tags and article titles ("titanium" finds iPhone 17 Pro)
type Inside = { subtitle?: string; description?: string; tags?: { label: string }[]; articles?: { title: string }[] };
const INSIDE: Record<string, Inside> = { ...(scrollbookData.books as Record<string, Inside>), ...(STORIES as Record<string, Inside>) };
for (const h of INDEX) {
  const b = INSIDE[h.slug]; if (!b) continue;
  h.tags += " " + [b.subtitle, b.description, ...(b.tags ?? []).map((t) => t.label), ...(b.articles ?? []).map((a) => a.title)].filter(Boolean).join(" ").toLowerCase();
}
const BY_SLUG = new Map(INDEX.map((h) => [h.slug, h]));
const hrefOf = (h: Hit) => h.href ?? `/scrollbook/${h.slug}`;

// Live constants (search-nav.v1.js): DEBOUNCE_MS 180, MIN_QUERY 2, MAX_RESULTS 6.
const DEBOUNCE_MS = 180, MIN_QUERY = 2, MAX_RESULTS = 6;
const RECENT = 4;
// quick filters at the top of the panel: each shuffles Discover with that filter (app/page.tsx QUICK)
const QUICK = [
  { href: "/?c=new", label: "Just added" },
  { href: "/?c=unread", label: "New to me" },
  { href: "/?c=quick", label: "Quick reads" },
  { href: "/", label: "Everything" },
];
// Categories: the 8 broad ones, in their set order (your interests move to the front)
const CATEGORIES = INDUSTRY.filter((f) => f.episodes.length).map((f) => ({ slug: f.slug, href: `/?c=${f.slug}`, title: f.title }));
// Topics and collections are search results too: "film" → "Shuffle Film · 9 stories", which deals that deck in Discover
const DECKS: Hit[] = [
  // each category also answers to the narrower topics it absorbed ("film" or "anime" → Entertainment)
  ...INDUSTRY.filter((f) => f.episodes.length).map((f) => ({ slug: f.slug, title: f.title, count: f.episodes.length, art: f.episodes.map((s) => BY_SLUG.get(s)?.thumb).find(Boolean),
    also: [((f as { keywords?: string }).keywords ?? ""), ...((f as { parts?: string[] }).parts ?? []).map((p) => filters.find((x) => x.slug === p && x.group === "industry")?.title ?? p)].join(" ") })),
].map((t) => ({ slug: `deck:${t.slug}`, title: `Shuffle ${t.title}`, date: "", thumb: t.art, tags: `${t.title} ${"also" in t ? t.also : ""}`.toLowerCase(), href: `/?c=${t.slug}`, label: `Category · ${t.count} ${t.count === 1 ? "story" : "stories"}` }));
const deckHits = (q: string) => {
  const v = q.toLowerCase().trim();
  return DECKS.filter((d) => d.tags.split(/[\s/&-]+/).some((w) => w.startsWith(v)) || d.tags.startsWith(v)).slice(0, 2);
};
// a few topics to offer when a search finds nothing
const TRY = INDUSTRY.slice(0, 4).map((f) => ({ href: `/?c=${f.slug}`, title: f.title }));
// when nothing is saved yet: the start of the Discover deck
const PICKS = scrollbookData.deck.slice(0, RECENT).map((d) => BY_SLUG.get(d.slug)).filter((h): h is Hit => !!h);

/** edit distance between two short words, giving up past `max` (typo tolerance: "nvida" → "nvidia") */
function near(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i), pp = prev;
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // two swapped letters ("costoc" → "costco") count as one slip
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1);
    }
    if (Math.min(...cur) > max) return false;
    pp = prev; prev = cur;
  }
  return prev[b.length] <= max;
}
const WORDS = new Map(INDEX.map((e) => [e.slug, e.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)]));

function search(q: string): Hit[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return INDEX
    .map((e) => {
      const title = e.title.toLowerCase(), tags = e.tags;
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 4;
        else if (tags.includes(t)) score += 2;
        // a typo in a title word still counts (one slip for short words, two for long ones), ranked below exact hits
        else if (t.length >= 4 && WORDS.get(e.slug)!.some((w) => near(t, w, t.length >= 7 ? 2 : 1))) score += 1.5; // a whole word, misspelled
        else if (t.length >= 4 && WORDS.get(e.slug)!.some((w) => w.length > t.length && near(t, w.slice(0, t.length), 1))) score += 1; // the start of a longer word
        else return null;
      }
      return { e, score };
    })
    .filter((x): x is { e: Hit; score: number } => !!x)
    .sort((a, b) => b.score - a.score || b.e.date.localeCompare(a.e.date))
    .slice(0, MAX_RESULTS).map((x) => x.e);
}

function Item({ ep, active, onPick }: { ep: Hit; active?: boolean; onPick: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
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
  const [mine, setMine] = useState<string[]>([]); // your interests, shown first in Categories
  useEffect(() => { if (open) setMine(loadInterests()); }, [open]);
  const categories = useMemo(() => [...CATEGORIES].sort((a, b) => Number(mine.includes(b.slug)) - Number(mine.includes(a.slug))), [mine]);
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
  // matching topics lead (they shuffle Discover), then stories
  const results = useMemo(() => (query ? [...deckHits(query), ...search(query)].slice(0, MAX_RESULTS + 2) : []), [query]);

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
  // open a result. From a story to Discover (a topic, a category, "New"…), it's the same move as Back: the story's cover
  // and title morph into the deck's top card (lib/viewTransition.ts). The panel closes first so it isn't in the snapshot.
  const go = (href: string) => {
    flushSync(pick);
    const toDiscover = href === "/" || href.startsWith("/?");
    if (location.pathname.startsWith("/scrollbook/") && toDiscover)
      navigateWithTransition(() => router.push(href, { scroll: false }), leftStoryPage, deckImageReady);
    else router.push(href);
  };
  // a plain click goes through `go`; cmd / ctrl / shift / middle click keep the link's normal behaviour
  const follow = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) { pick(); return; }
    e.preventDefault(); go(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) {
      if (e.key === "Enter") e.preventDefault(); // nothing to open
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      go(hrefOf(results[active >= 0 ? active : 0])); // Enter opens the highlighted result, else the top match
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
          <input ref={input} id="nav-search" className="search-input" type="search" placeholder="Search stories or topics" autoComplete="off" value={q}
            onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
            role="combobox" aria-expanded={view === "results"} aria-controls="search-results" aria-activedescendant={active >= 0 ? `search-r-${active}` : undefined} />
          <SearchIcon className="search-bar__icon search-bar__icon--trail" />
          <button type="button" className="search-cancel" onClick={(e) => { e.stopPropagation(); close(); }}>cancel</button>
        </form>
        <div className="search-body" hidden={!open}>
          <div className="spacer-xs" />
          {view === "initial" && (
            <div className="search-initial">
              <div className="search-label">shuffle by</div>
              <div className="search-grid">{QUICK.map((f) => <Link key={f.href} href={f.href} className="search-chip" onClick={follow(f.href)}>{f.label}</Link>)}</div>
              <div className="spacer-sm" /><div className="search-rule" /><div className="spacer-sm" />
              {/* one place to pick a category: each shuffles Discover to just that */}
              <div className="search-label">categories</div>
              <div className="search-grid">{categories.map((f) => <Link key={f.href} href={f.href} className="search-chip" onClick={follow(f.href)}>{f.title}</Link>)}</div>
              <div className="spacer-sm" /><div className="search-rule" /><div className="spacer-sm" />
              <div className="search-label">{shelf.length ? "pick up where you left off" : "today's picks"}</div>
              {(shelf.length ? shelf : PICKS).map((ep) => <Item key={ep.slug} ep={ep} onPick={follow(hrefOf(ep))} />)}
            </div>
          )}
          {view === "results" && (
            <div id="search-results" className="search-results" role="listbox">
              {results.map((ep, i) => <div key={hrefOf(ep)} id={`search-r-${i}`} role="option" aria-selected={i === active}><Item ep={ep} active={i === active} onPick={follow(hrefOf(ep))} /></div>)}
            </div>
          )}
          {view === "empty" && (
            <div className="search-none">
              <p className="search-none__text">Nothing by that name. Try shuffling a topic instead:</p>
              <div className="search-grid">{TRY.map((f) => <Link key={f.href} href={f.href} className="search-chip" onClick={follow(f.href)}>{f.title}</Link>)}</div>
            </div>
          )}
          <div style={{ height: 20 }} />
        </div>
      </div>
    </>
  );
}
