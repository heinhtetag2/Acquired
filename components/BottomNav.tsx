"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { previousOf, track } from "@/lib/navTrail";
import { advanceDeck, runAt } from "@/lib/deckRun";
import { deckImageReady, leftStoryPage, navigateWithTransition } from "@/lib/viewTransition";
import { dayKey, loadGoal, loadName, onProfileChange, readsByDay } from "@/lib/profile";

/* Mobile-only bottom bar (≤767px): two main tabs + "More" in a pill, and beside it a round "Today" ring (stories read vs your daily goal;
   taps open your profile). Search sits in the top bar, left of the logo.
   Everything else from the site menu lives in the More sheet, which slides up from behind the bar, with your profile on top. */

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
// compass: the home deck is for discovering stories, not a "home" page
// Next: a small stack of cards (back to the deck, onto the next card); the back card only peeks out, so no lines cross
const NextIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><rect x="9.5" y="3.5" width="10.5" height="14.5" rx="2" {...ic} /><path d="M9.5 6.6 6 7.3a2 2 0 0 0-1.55 2.36l1.9 9.3a2 2 0 0 0 2.36 1.56l5.6-1.14" {...ic} /></svg>);
const DiscoverIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="8.5" {...ic} /><path d="M15.5 8.5 13.4 13.4 8.5 15.5l2.1-4.9z" {...ic} /></svg>);
const ShelfIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 4.5v13M9 4.5v13M13.2 5.3l3.4 12.2M4 19.5h16" {...ic} /></svg>);
const MoreIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="6" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="18" cy="12" r="1.4" fill="currentColor" /></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M7 7l10 10M17 7 7 17" {...ic} /></svg>);

const TABS = [
  { label: "Discover", href: "/", Icon: DiscoverIcon },
  { label: "Shelf", href: "/shelf", Icon: ShelfIcon }, // your saved stories
];
const MAIN = new Set([...TABS.map((t) => t.href), "/me"]); // /me gets its own profile row in the More sheet
const BackIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" {...ic} /></svg>);

/** Detail pages get the compact bar (Back + Home). Value = where Back goes when there's no history to return to. */
const DETAIL: [RegExp, string][] = [
  [/^\/scrollbook\/[^/]+/, "/"], // stories are opened from the home deck
  // the classic demo pages (More menu)
  [/^\/acq2-episodes\/[^/]+/, "/acq2"],
  [/^\/artifacts\/[^/]+/, "/artifacts"],
];

export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [more, setMore] = useState(false);
  const parent = DETAIL.find(([re]) => re.test(pathname))?.[1];
  const goBack = () => {
    // back through in-app history when there is some, otherwise up to the page's parent
    const prev = previousOf(location.pathname + location.search);
    if (!document.querySelector(".ep-art")) { if (prev) router.back(); else router.push(parent ?? "/"); return; }
    // Story pages animate back: the big cover shrinks into the deck card (lib/viewTransition.ts).
    // Inside a view transition, Next's popstate handling (router.back) stalls ~0.9s while painting is paused,
    // so go to the previous page by replacing this entry instead: same place, same history length, no stall.
    navigateWithTransition(() => router.replace(prev ?? parent ?? "/", { scroll: false }), leftStoryPage, deckImageReady);
  };

  useEffect(() => { setMore(false); track(location.pathname + location.search); }, [pathname]);
  // on a detail page, preload where Back goes so the animated return doesn't wait on the network
  useEffect(() => {
    if (!parent) return;
    router.prefetch(previousOf(location.pathname + location.search) ?? parent);
  }, [pathname, parent, router]);

  // Detail pages: while the page's own "all episodes" button (data-bnav-anchor) is on screen the bar stays tucked away;
  // it slides in once that button scrolls out of view and tucks away again when you scroll back to the top.
  const [tucked, setTucked] = useState(!!parent);
  useEffect(() => {
    if (!parent) { setTucked(false); return; }
    let io: IntersectionObserver | undefined;
    const raf = requestAnimationFrame(() => {
      const anchor = document.querySelector("[data-bnav-anchor]");
      if (!anchor) { setTucked(false); return; } // no top back button on this page: keep the bar
      io = new IntersectionObserver(([e]) => setTucked(e.isIntersecting), { rootMargin: "-72px 0px 0px 0px" });
      io.observe(anchor);
    });
    return () => { cancelAnimationFrame(raf); io?.disconnect(); };
  }, [pathname, parent]);
  // the profile row in the More sheet: your name and today's progress, read when the sheet opens
  const [me, setMe] = useState({ name: "", today: 0, goal: 3 });
  // today's progress for the ring beside the pill: refreshed on every page and whenever a story is read
  const [today, setToday] = useState<{ n: number; goal: number } | null>(null);
  useEffect(() => {
    const load = () => setToday({ n: readsByDay()[dayKey()]?.length ?? 0, goal: loadGoal() });
    load();
    const off = onProfileChange(load);
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => { off(); window.removeEventListener("storage", onStorage); };
  }, [pathname]);
  useEffect(() => {
    if (!more) return;
    setMe({ name: loadName(), today: readsByDay()[dayKey()]?.length ?? 0, goal: loadGoal() });
  }, [more]);
  useEffect(() => {
    if (!more) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMore(false); };
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("bnav-lock");
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.classList.remove("bnav-lock"); };
  }, [more]);

  // Opened from Discover, Back returns to the card you just read; "Next" returns to the deck one card on,
  // so you're straight onto something new and still choose what to read. From anywhere else it's Discover, the way home.
  const [deckFrom, setDeckFrom] = useState<{ slug: string; from: string } | null>(null);
  useEffect(() => {
    const slug = /^\/scrollbook\/([^/]+)/.exec(pathname)?.[1];
    const run = slug ? runAt(slug) : null;
    const prev = previousOf(location.pathname + location.search);
    // came here from the deck (or reloaded the story the deck just opened, which forgets in-app history).
    // Compare paths only: a deck picked from Search ("/?c=new") changes just the query, which the trail can miss.
    const path = (u?: string) => u?.split(/[?#]/)[0];
    setDeckFrom(slug && run && (path(prev) === path(run.from) || (!prev && run.opened)) ? { slug, from: run.from } : null);
  }, [pathname]);
  const goNext = () => {
    if (!deckFrom) return;
    advanceDeck(deckFrom.slug); // the deck opens on the card after this story
    // same as Back: replace (so the deck isn't stacked on this story in history), with the cover shrinking into the deck card
    const to = deckFrom.from;
    navigateWithTransition(() => router.replace(to, { scroll: false }), leftStoryPage, deckImageReady);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const extra = site.menu.filter((l) => !MAIN.has(l.href));
  // pages listed under More (e.g. New / the Library) light up the More tab while you're on them
  const inMore = !TABS.some((t) => isActive(t.href)) && (extra.some((l) => isActive(l.href)) || isActive("/me"));

  return (
    <>
      <div className={`bnav-sheet${more ? " is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && setMore(false)} aria-hidden={!more} inert={!more}>
        <div className="bnav-sheet__panel" role="dialog" aria-label="More">
          <Link href="/me" className="bnav-sheet__me" aria-current={isActive("/me") ? "page" : undefined}>
            <span className="bnav-sheet__avatar" aria-hidden>{(me.name || "R")[0].toUpperCase()}</span>
            <span className="bnav-sheet__me-text">
              <span className="bnav-sheet__me-name">{me.name || "Your profile"}</span>
              <span className="t-label-xs">{me.today >= me.goal ? `Goal done today · ${me.today}/${me.goal}` : `Today ${me.today}/${me.goal} · stats, streak & goal`}</span>
            </span>
            <svg className="bnav-sheet__me-go" viewBox="0 0 24 24" aria-hidden><path d="M9 6l6 6-6 6" {...ic} /></svg>
          </Link>
          <nav className="bnav-sheet__links" aria-label="More pages">
            {extra.map((l, i) => (
              <Link key={l.href} href={l.href} className="bnav-sheet__link" style={{ ["--i" as string]: i }} aria-current={isActive(l.href) ? "page" : undefined}>{l.label}</Link>
            ))}
          </nav>
        </div>
      </div>

      <nav className={`bnav${parent ? " bnav--detail" : ""}${parent && tucked ? " is-tucked" : ""}`} aria-label="Main" aria-hidden={parent && tucked ? true : undefined} inert={parent && tucked ? true : undefined}>
        {parent ? (
          <div className="bnav__pill">
            <button type="button" className="bnav__tab bnav__tab--icon" onClick={goBack} aria-label="Back"><BackIcon /></button>
            {/* detail pages: Back returns to where you came from (Shelf, Library…), Discover is the way home. Save lives at the top of the story */}
            {deckFrom ? (
              <button type="button" className="bnav__tab" onClick={goNext} aria-label="Next: back to Discover on the next card"><NextIcon /><span>Next</span></button>
            ) : (
            <Link href="/" className="bnav__tab" onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button || !document.querySelector(".ep-art")) return;
              e.preventDefault(); navigateWithTransition(() => router.push("/"), leftStoryPage, deckImageReady);
            }}><DiscoverIcon /><span>Discover</span></Link>
            )}
          </div>
        ) : (
          <div className="bnav__pill">
            {TABS.map(({ label, href, Icon }) => (
              <Link key={href} href={href} className={`bnav__tab${isActive(href) && !more ? " is-active" : ""}`} aria-current={isActive(href) ? "page" : undefined}>
                <Icon /><span>{label}</span>
              </Link>
            ))}
            <button type="button" className={`bnav__tab${more || inMore ? " is-active" : ""}`} aria-expanded={more} onClick={() => setMore((m) => !m)}>
              {more ? <CloseIcon /> : <MoreIcon />}<span>{more ? "Close" : "More"}</span>
            </button>
          </div>
        )}
        {!parent && (() => {
          const n = today?.n ?? 0, goal = today?.goal ?? 3, C = 2 * Math.PI * 24;
          return (
            <Link href="/me" className={`bnav__today${n >= goal ? " is-done" : ""}`} onClick={() => setMore(false)}
              aria-label={`Today: ${n} of ${goal} stories read. Open your profile`}>
              <svg viewBox="0 0 54 54" aria-hidden><circle cx="27" cy="27" r="24" /><circle cx="27" cy="27" r="24" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - Math.min(1, n / goal)) }} /></svg>
              <span className="bnav__today-n" suppressHydrationWarning><b>{today ? n : "\u00a0"}</b>{today ? `/${goal}` : ""}</span>
            </Link>
          );
        })()}
      </nav>
    </>
  );
}
