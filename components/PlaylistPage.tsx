"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { formatDate, site } from "@/lib/site";
import type { EpisodeLite as Episode } from "@/lib/content";
import { ArrowUpRight, MenuIcon, PlayIcon, PauseIcon, SpotifyIcon, PodcastIcon, VideoIcon } from "./Icons";
import EpisodePlayer from "./episode/EpisodePlayer";

const VIEW_KEY = "acqPlaylistView";

export default function PlaylistPage({ title, episodes, eyebrow, query = "" }: { title: string; episodes: Episode[]; eyebrow?: string; query?: string }) {
  const pathname = usePathname();
  const q = query.trim().toLowerCase();
  const [skim, setSkim] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [current, setCurrent] = useState<Episode | null>(null);

  useEffect(() => { try { setSkim(localStorage.getItem(VIEW_KEY) === "skim"); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, skim ? "skim" : "browse"); } catch {} }, [skim]);
  useEffect(() => setSidebar(false), [pathname]);
  useEffect(() => {
    if (!sidebar) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebar(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebar]);

  const list = useMemo(() => q ? episodes.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)) : episodes, [episodes, q]);
  const heading = q ? `Results for “${q}”` : title;

  const play = (ep: Episode) => {
    if (current?.slug === ep.slug) { window.dispatchEvent(new CustomEvent("acq:toggle")); return; }
    setCurrent(ep);
  };

  const toggles = (
    <div className="pl-toggles" role="group" aria-label="View">
      <button className="filter-btn" aria-pressed={!skim} onClick={() => setSkim(false)}>browse</button>
      <button className="filter-btn" aria-pressed={skim} onClick={() => setSkim(true)}>skim</button>
    </div>
  );

  return (
    <div className="pl">
      <div className="pl-nav-band" data-theme="playlist" aria-hidden />
      <div className="pl-bar">
        <button className="icon-btn" aria-expanded={sidebar} aria-controls="pl-sidebar" onClick={() => setSidebar(!sidebar)}><MenuIcon /><span className="sr-only">Filters</span></button>
        <div className="pl-bar__title">{heading}</div>
        {!eyebrow && toggles}
      </div>
      <div className={`pl-sidebar-pop ${sidebar ? "is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && setSidebar(false)}>
        <nav id="pl-sidebar" className="pl-sidebar" aria-label="Episode filters">
          {site.sidebar.map((g, gi) => (
            <div key={g.heading} className="pl-group">
              <div className="pl-group__head t-label">{g.heading}</div>
              {gi === 0 && <Link href="/episodes" className="pl-link" aria-current={pathname === "/episodes" ? "page" : undefined}>all episodes</Link>}
              {g.links.filter((l) => l.href !== "/episodes").map((l) => (
                <Link key={l.href} href={l.href} className="pl-link" aria-current={pathname === l.href ? "page" : undefined}>
                  {l.label}{l.href === "/acq2" && <ArrowUpRight />}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="pl-main">
        {eyebrow ? (
          <div className="pl-head pl-head--filter">
            <div className="pl-eyebrow t-label-lg">{eyebrow}</div>
            <h1 className="t-h2">{heading}</h1>
          </div>
        ) : (
          <>
            <div className="spacer-xl only-desktop-xl" />
            <div className="pl-head">
              <h1 className="t-h2">{heading}</h1>
              {toggles}
            </div>
          </>
        )}
        {list.length === 0 && <p className="pl-empty t-body">No episodes match “{q}”.</p>}
        <div className={`pl-list ${skim ? "is-skim" : ""}`}>
          {list.map((ep) => {
            const art = ep.thumb ?? ep.image ?? ep.cover;
            const meta = (
              <div className="pl-meta t-label">
                {ep.video && <VideoIcon aria-label="Video episode" />}
                <span>{ep.seasonCode ? `${ep.seasonCode}${ep.episode ? ` E${ep.episode}` : ""} · ` : ""}{formatDate(ep.date)}</span>
              </div>
            );
            const isCur = current?.slug === ep.slug;
            return (
              <article key={ep.slug} className="pl-row">
                <Link href={`/episodes/${ep.slug}`} className="pl-row__link"><span className="sr-only">{ep.title}</span></Link>
                <div className="pl-art pl-art--desktop">{art && <img src={art} alt="" loading="lazy" />}</div>
                <div className="pl-body">
                  <div className="pl-headrow">
                    <div className="pl-art pl-art--mobile">{art && <img src={art} alt="" loading="lazy" />}</div>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="pl-title">{ep.title}</h3>
                      {meta}
                    </div>
                  </div>
                  <div className="pl-extra">
                    <p className="pl-desc t-body-140">{ep.description}</p>
                    <div className="pl-acts">
                      <div className="ep-card__links">
                        {ep.spotify && <a className="icon-btn" href={ep.spotify} target="_blank" rel="noreferrer" aria-label={`${ep.title} on Spotify`}><SpotifyIcon /></a>}
                        {ep.apple && <a className="icon-btn" href={ep.apple} target="_blank" rel="noreferrer" aria-label={`${ep.title} on Apple Podcasts`}><PodcastIcon /></a>}
                      </div>
                    </div>
                  </div>
                </div>
                {ep.audioSrc ? (
                  <button className="pl-play" aria-pressed={isCur} onClick={() => play(ep)} aria-label={`Play ${ep.title}`}>{isCur ? <PauseIcon /> : <PlayIcon />}</button>
                ) : (
                  <Link className="pl-play" href={`/episodes/${ep.slug}`} aria-label={`Open ${ep.title}`}><PlayIcon /></Link>
                )}
              </article>
            );
          })}
        </div>
        <div className="spacer-base" />
      </div>
      {current && <div data-ep-theme={current.theme}><EpisodePlayer key={current.slug} ep={current} autoPlay /></div>}
    </div>
  );
}
