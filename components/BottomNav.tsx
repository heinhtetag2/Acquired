"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { previousOf, track } from "@/lib/navTrail";
import { deckImageReady, leftStoryPage, navigateWithTransition } from "@/lib/viewTransition";
import { useSaved } from "@/lib/saved";
import { iconFor } from "./Icons";

/* Mobile-only bottom bar (≤767px): two main tabs + "More" in a cream pill, and a round search button beside it (search moves here from the top bar).
   Everything else from the site menu lives in the More sheet, which slides up from behind the bar. */

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
// compass: the home deck is for discovering stories, not a "home" page
const DiscoverIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="8.5" {...ic} /><path d="M15.5 8.5 13.4 13.4 8.5 15.5l2.1-4.9z" {...ic} /></svg>);
const ShelfIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 4.5v13M9 4.5v13M13.2 5.3l3.4 12.2M4 19.5h16" {...ic} /></svg>);
const MoreIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="6" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="18" cy="12" r="1.4" fill="currentColor" /></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M7 7l10 10M17 7 7 17" {...ic} /></svg>);
const SaveIcon = ({ filled }: { filled?: boolean }) => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" {...ic} fill={filled ? "currentColor" : "none"} /></svg>);
const SearchIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5" {...ic} /><path d="M16 16l4 4" {...ic} /></svg>);

const TABS = [
  { label: "Discover", href: "/", Icon: DiscoverIcon },
  { label: "Shelf", href: "/episodes", Icon: ShelfIcon }, // your saved stories (the old Episodes tab)
];
const MAIN = new Set(TABS.map((t) => t.href));
const BackIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" {...ic} /></svg>);

/** Detail pages get the compact bar (Back + Home). Value = where Back goes when there's no history to return to. */
const DETAIL: [RegExp, string][] = [
  [/^\/episodes\/[^/]+/, "/episodes"],
  [/^\/scrollbook\/[^/]+/, "/"], // Scrollbook stories are opened from the home deck
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
  useEffect(() => {
    if (!more) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMore(false); };
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("bnav-lock");
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.classList.remove("bnav-lock"); };
  }, [more]);

  // Story pages: the second button saves the story (Back already leads out; a Discover button there was a duplicate)
  const storySlug = /^\/scrollbook\/([^/]+)/.exec(pathname)?.[1];
  const [isSaved, toggleSave] = useSaved(storySlug);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const extra = site.menu.filter((l) => !MAIN.has(l.href));
  // pages listed under More (e.g. New / the Library) light up the More tab while you're on them
  const inMore = !TABS.some((t) => isActive(t.href)) && extra.some((l) => isActive(l.href));

  return (
    <>
      <div className={`bnav-sheet${more ? " is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && setMore(false)} aria-hidden={!more} inert={!more}>
        <div className="bnav-sheet__panel" role="dialog" aria-label="More">
          <nav className="bnav-sheet__links" aria-label="More pages">
            {extra.map((l, i) => (
              <Link key={l.href} href={l.href} className="bnav-sheet__link" style={{ ["--i" as string]: i }} aria-current={isActive(l.href) ? "page" : undefined}>{l.label}</Link>
            ))}
          </nav>
          <div className="bnav-sheet__listen">
            <span className="t-label-xs">Listen on</span>
            <div className="bnav-sheet__icons">
              {site.listen.map((l) => { const Icon = iconFor(l.icon); return <a key={l.label} href={l.href} target="_blank" rel="noreferrer" aria-label={l.label}><Icon /></a>; })}
            </div>
          </div>
        </div>
      </div>

      <nav className={`bnav${parent ? " bnav--detail" : ""}${parent && tucked ? " is-tucked" : ""}`} aria-label="Main" aria-hidden={parent && tucked ? true : undefined} inert={parent && tucked ? true : undefined}>
        {parent ? (
          <div className="bnav__pill">
            <button type="button" className="bnav__tab bnav__tab--icon" onClick={goBack} aria-label="Back"><BackIcon /></button>
            {storySlug ? (
              <button type="button" className={`bnav__tab${isSaved ? " is-active" : ""}`} aria-pressed={isSaved} onClick={toggleSave}
                aria-label={isSaved ? "Saved to your shelf. Tap to remove" : "Save to your shelf"}>
                <SaveIcon filled={isSaved} /><span>{isSaved ? "Saved" : "Save"}</span>
              </button>
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
        {!parent && <button type="button" className="bnav__search" aria-label="Search" onClick={() => { setMore(false); window.dispatchEvent(new Event("sb:search-open")); }}><SearchIcon /></button>}
      </nav>
    </>
  );
}
