"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { iconFor } from "./Icons";

/* Mobile-only bottom bar (≤767px): three main tabs + "More" in a cream pill, and a round search button beside it (search moves here from the top bar).
   Everything else from the site menu lives in the More sheet, which slides up from behind the bar. */

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const HomeIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" {...ic} /></svg>);
const EpisodesIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" {...ic} /><rect x="3.5" y="13.5" width="4" height="6" rx="1.5" {...ic} /><rect x="16.5" y="13.5" width="4" height="6" rx="1.5" {...ic} /></svg>);
const LibraryIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M12 6.5C10.3 5.2 7.8 4.6 4.5 4.6v13c3.3 0 5.8.6 7.5 1.9 1.7-1.3 4.2-1.9 7.5-1.9v-13c-3.3 0-5.8.6-7.5 1.9zM12 6.5v13" {...ic} /></svg>);
const MoreIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="6" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="18" cy="12" r="1.4" fill="currentColor" /></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M7 7l10 10M17 7 7 17" {...ic} /></svg>);
const SearchIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5" {...ic} /><path d="M16 16l4 4" {...ic} /></svg>);

const TABS = [
  { label: "Home", href: "/", Icon: HomeIcon },
  { label: "Episodes", href: "/episodes", Icon: EpisodesIcon },
  { label: "Library", href: "/library", Icon: LibraryIcon },
];
const MAIN = new Set(TABS.map((t) => t.href));
const BackIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" {...ic} /></svg>);

/** Detail pages get the compact bar (Back + Home). Value = where Back goes when there's no history to return to. */
const DETAIL: [RegExp, string][] = [
  [/^\/episodes\/[^/]+/, "/episodes"],
  [/^\/scrollbook\/[^/]+/, "/episodes"],
  [/^\/acq2-episodes\/[^/]+/, "/acq2"],
  [/^\/artifacts\/[^/]+/, "/artifacts"],
];

export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [more, setMore] = useState(false);
  const parent = DETAIL.find(([re]) => re.test(pathname))?.[1];
  const goBack = () => {
    // back through history when we came from this site, otherwise up to the list page
    const fromHere = document.referrer && new URL(document.referrer).origin === location.origin;
    if (fromHere && history.length > 1) router.back(); else router.push(parent ?? "/");
  };

  useEffect(() => setMore(false), [pathname]);
  useEffect(() => {
    if (!more) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMore(false); };
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("bnav-lock");
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.classList.remove("bnav-lock"); };
  }, [more]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const extra = site.menu.filter((l) => !MAIN.has(l.href));

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

      <nav className={`bnav${parent ? " bnav--detail" : ""}`} aria-label="Main">
        {parent ? (
          <div className="bnav__pill">
            <button type="button" className="bnav__tab bnav__tab--icon" onClick={goBack} aria-label="Back"><BackIcon /></button>
            <Link href="/" className="bnav__tab"><HomeIcon /><span>Home</span></Link>
          </div>
        ) : (
          <div className="bnav__pill">
            {TABS.map(({ label, href, Icon }) => (
              <Link key={href} href={href} className={`bnav__tab${isActive(href) && !more ? " is-active" : ""}`} aria-current={isActive(href) ? "page" : undefined}>
                <Icon /><span>{label}</span>
              </Link>
            ))}
            <button type="button" className={`bnav__tab${more ? " is-active" : ""}`} aria-expanded={more} onClick={() => setMore((m) => !m)}>
              {more ? <CloseIcon /> : <MoreIcon />}<span>{more ? "Close" : "More"}</span>
            </button>
          </div>
        )}
        {!parent && <button type="button" className="bnav__search" aria-label="Search" onClick={() => { setMore(false); window.dispatchEvent(new Event("sb:search-open")); }}><SearchIcon /></button>}
      </nav>
    </>
  );
}
