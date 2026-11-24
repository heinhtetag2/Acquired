import Link from "next/link";
import { formatLongDate, type Episode } from "@/lib/content";
import { ArrowLeft, ArrowUpRight, PlusIcon, SpotifyIcon, AppleGlyph, VideoIcon } from "../Icons";
import ArtZoom from "./ArtZoom";

function Presenting({ ep, className }: { ep: Episode; className: string }) {
  if (!ep.presentedBy) return null;
  return (
    <div className={`ep-presenting ${className}`}>
      <a href={ep.presentedBy.href} target="_blank" rel="noreferrer" className="ep-presenting__link">
        <span className="t-label-xs">Presented by</span>
        <span className="ep-presenting__logo" role="img" aria-label={ep.presentedBy.label} />
      </a>
    </div>
  );
}
function Sponsors({ ep, className }: { ep: Episode; className: string }) {
  if (!ep.sponsors?.length) return null;
  return (
    <div className={`ep-sponsors ${className}`}>
      <div className="t-label" style={{ lineHeight: "var(--lh-snug)" }}>Many thanks to our season partners</div>
      <div className="ep-sponsors__list">{ep.sponsors.map((s) => <a key={s} href="#">{s}</a>)}</div>
    </div>
  );
}

export default function EpisodeHero({ ep }: { ep: Episode }) {
  const art = ep.image ?? ep.cover;
  return (
    <main id="main" className="ep-hero">
      <div className="ep-left">
        <div className="ep-left__top">
          <Link href="/episodes" className="btn btn--back" data-bnav-anchor><ArrowLeft />all episodes</Link>
          <div className="spacer-sm" />
        </div>
        <ArtZoom src={art} alt={ep.title} color={ep.color} animated={ep.imageAnimated && art === ep.image} />
        <div className="spacer-lg" />
        <div className="ep-details">
          {!!ep.tags?.length && (
            <div className="ep-badges">{ep.tags.map((t) => <Link key={t.href} href={t.href} className="badge">{t.label}</Link>)}</div>
          )}
          <h1 className="ep-title">{ep.title}</h1>
          <div className="spacer-2xs" />
          <div className="ep-meta">
            {ep.seasonLabel && <Link href={ep.seasonHref ?? "#"} className="badge">{ep.seasonLabel}</Link>}
            <div className="t-label-xs">{ep.episode ? `Episode ${ep.episode} · ` : ""}<time dateTime={ep.date}>{formatLongDate(ep.date)}</time></div>
          </div>
          <div className="spacer-base" />
          <div className="ep-links">
            {ep.spotify && <a className="ep-icon-btn" href={ep.spotify} target="_blank" rel="noreferrer" aria-label="Listen on Spotify"><SpotifyIcon /></a>}
            {ep.apple && <a className="ep-icon-btn" href={ep.apple} target="_blank" rel="noreferrer" aria-label="Listen on Apple Podcasts"><AppleGlyph /></a>}
            {ep.youtube && <a className="ep-icon-btn" href={ep.youtube} target="_blank" rel="noreferrer" aria-label="Watch on YouTube"><VideoIcon /></a>}
            {ep.netflix && <a className="ep-icon-btn" href={ep.netflix} target="_blank" rel="noreferrer" aria-label="Watch on Netflix"><span className="n-glyph" aria-hidden>N</span></a>}
          </div>
          <div className="ep-popup-btns">
            {ep.companion && <a href="#companion" className="popup-btn">PDF Companion<PlusIcon /></a>}
            {(ep.hasTranscript || !!ep.chapters?.length) && <a href="#transcript" className="popup-btn">Transcript<PlusIcon /></a>}
            {!!ep.sources?.length && <a href="#sources" className="popup-btn">Sources<PlusIcon /></a>}
          </div>
          <Sponsors ep={ep} className="ep-desktop-only" />
        </div>
      </div>

      <div className="ep-right">
        <Presenting ep={ep} className="ep-mobile-only" />
        {ep.subtitle && <h2 className="ep-h2">{ep.subtitle}</h2>}
        <div className="rich-h2">Overview</div>
        <div className="rich">{(ep.overview ?? [ep.description]).map((p, i) => <p key={i}>{p}</p>)}</div>
        <Presenting ep={ep} className="ep-desktop-only" />
        {!!ep.artifacts?.length && (
          <div className="ep-artifacts">
            <div className="ep-artifacts__head">
              <Link href={`/artifacts`} className="t-label">Episode Artifacts</Link>
              <ArrowUpRight width={16} height={16} />
            </div>
            <div className="ep-artifacts__strip" tabIndex={0} role="region" aria-label="Episode artifacts">
              {ep.artifacts.map((src) => <div key={src} className="ep-artifacts__frame"><img src={src} alt="" loading="lazy" fetchPriority="low" /></div>)}
            </div>
          </div>
        )}
        <div className="spacer-base" />
        <div className="ep-mobile-only ep-sponsors-m">
          <div className="ep-rule-m" />
          <Sponsors ep={ep} className="" />
          <div className="ep-rule-m" />
        </div>
        {(ep.links || ep.carveOuts) && (
          <>
            <h2 className="ep-h2">More on the episode</h2>
            <div className="rich">
              {ep.links && (<><h2>Links</h2><ul>{ep.links.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: l.html }} />)}</ul></>)}
              {ep.carveOuts && (<><h2>Carve Outs</h2><ul>{ep.carveOuts.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: l.html }} />)}</ul></>)}
            </div>
          </>
        )}
        <p className="ep-disclaimer">Note: Acquired hosts and guests may hold assets discussed in this episode. This podcast is not investment advice, and is intended for informational and entertainment purposes only. You should do your own research and make your own independent decisions when considering any financial transactions.</p>
      </div>
    </main>
  );
}
