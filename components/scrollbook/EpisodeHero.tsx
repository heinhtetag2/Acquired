import Link from "next/link";
import { formatLongDate, type Book, type Episode } from "@/lib/content";
import { ArrowUpRight, PlusIcon, SpotifyIcon, AppleGlyph, VideoIcon } from "../Icons";
import ArtZoom from "./ArtZoom";
import BookFacts from "./BookFacts";
import StoryBack from "./StoryBack";
import StorySave from "./StorySave";
import TodayProgress from "./ReadingPlan";
import GoDeeper from "./GoDeeper";
import StoryEnd, { type EndCard } from "./StoryEnd";

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

/** The book's article: plain reading — section headings, paragraphs and the odd pull quote. */
function Story({ story }: { story: NonNullable<Book["story"]> }) {
  return (
    <article className="sb-story">
      {story.map((block, i) =>
        "quote" in block ? (
          <blockquote key={i} className="sb-story__quote"><p data-cid={`q${i}`}>{block.quote}</p></blockquote>
        ) : (
          <section key={i}>
            <h3 className="sb-story__h">{block.h}</h3>
            {block.p.map((t, j) => <p key={j} data-cid={`s${i}-${j}`}>{t}</p>)}
          </section>
        )
      )}
    </article>
  );
}

export default function EpisodeHero({ ep, connects = [], pool = [] }: { ep: Book; connects?: EndCard[]; pool?: EndCard[] }) {
  const art = ep.image ?? ep.cover;
  return (
    <main id="main" className="ep-hero">
      <div className="ep-left">
        <div className="ep-left__top">
          <div className="sb-top-row">
            <StoryBack />
            {!!ep.articles?.length && <TodayProgress slug={ep.slug} articles={ep.articles} demoRead={ep.demoRead} />}
          </div>
          <div className="spacer-sm" />
        </div>
        <ArtZoom src={art} alt={ep.title} color={ep.color} animated={ep.imageAnimated && art === ep.image} motion={ep.motion} />
        <div className="spacer-lg" />
        <div className="ep-details">
          {!!ep.tags?.length && (
            <div className="ep-badges">{ep.tags.filter((t) => !/^\/(features|season)\//.test(t.href)).map((t) => <Link key={t.href} href={t.href} className="badge">{t.label}</Link>)}</div>
          )}
          <h1 className="ep-title">{ep.title}</h1>
          <div className="spacer-2xs" />
          <div className="ep-meta">
            {/* no podcast season badge ("Season 13", "Spring 2025"): stories aren't episodes */}
            <div className="t-label-xs"><time dateTime={ep.date}>{formatLongDate(ep.date)}</time></div>
            <StorySave slug={ep.slug} title={ep.title} />
          </div>
          <div className="spacer-base" />
          <div className="ep-links">
            {ep.spotify && <a className="ep-icon-btn" href={ep.spotify} target="_blank" rel="noreferrer" aria-label="Listen on Spotify"><SpotifyIcon /></a>}
            {ep.apple && <a className="ep-icon-btn" href={ep.apple} target="_blank" rel="noreferrer" aria-label="Listen on Apple Podcasts"><AppleGlyph /></a>}
            {ep.youtube && <a className="ep-icon-btn" href={ep.youtube} target="_blank" rel="noreferrer" aria-label="Watch on YouTube"><VideoIcon /></a>}
            {ep.netflix && <a className="ep-icon-btn" href={ep.netflix} target="_blank" rel="noreferrer" aria-label="Watch on Netflix"><span className="n-glyph" aria-hidden>N</span></a>}
            {/* TikTok: the story's top TikTok */}
            {ep.deeper?.tiktok?.[0] && (
              <a className="ep-icon-btn" href={`https://www.tiktok.com/@${ep.deeper.tiktok[0].account}/video/${ep.deeper.tiktok[0].id}`} target="_blank" rel="noreferrer" aria-label={`Watch on TikTok (@${ep.deeper.tiktok[0].account})`}>
                <svg viewBox="0 0 24 24" aria-hidden><path d="M14.5 3.5c.4 2.4 1.9 4 4.5 4.3v3c-1.7 0-3.2-.5-4.5-1.4v6.1a5 5 0 1 1-5-5h.5v3.1a2 2 0 1 0 1.5 1.9V3.5z" fill="currentColor" /></svg>
              </a>
            )}
          </div>
          <div className="ep-popup-btns">
            {ep.companion && <a href="#companion" className="popup-btn">PDF Companion<PlusIcon /></a>}
            {(ep.hasTranscript || !!ep.chapters?.length) && <a href="#transcript" className="popup-btn">Transcript<PlusIcon /></a>}
            {/* Sources sits above Quick facts and opens a bottom sheet (there can be many) */}
            {/* Sources opens a sheet (a ›), unlike Quick facts below which opens in place (a +) */}
            {/* only real, linked sources: the clone's placeholder sections ("Source 1 placeholder") never show */}
            {!!ep.deeper?.sources?.length && (
              <a href="#sources" className="popup-btn popup-btn--sheet" aria-label="Sources. Opens a list">
                <span>Sources</span>
                <svg viewBox="0 0 16 16" aria-hidden><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            )}
            {!!ep.facts?.length && <BookFacts facts={ep.facts} />}
          </div>
          <Sponsors ep={ep} className="ep-desktop-only" />
        </div>
      </div>

      <div className="ep-right">
        <Presenting ep={ep} className="ep-mobile-only" />
        {ep.subtitle && <h2 className="ep-h2">{ep.subtitle}</h2>}
        <div className="rich-h2">Overview</div>
        <div className="rich">{(ep.overview ?? [ep.description]).map((p, i) => <p key={i} data-cid={`ov-${i}`}>{p}</p>)}</div>
        <Presenting ep={ep} className="ep-desktop-only" />
        {!!ep.artifacts?.length && (
          <div className="ep-artifacts">
            <div className="ep-artifacts__head">
              <Link href={`/artifacts`} className="t-label">Photos</Link>
              <ArrowUpRight width={16} height={16} />
            </div>
            <div className="ep-artifacts__strip" tabIndex={0} role="region" aria-label="Photos">
              {ep.artifacts.map((src) => <div key={src} className="ep-artifacts__frame"><img src={src} alt="" loading="lazy" fetchPriority="low" /></div>)}
            </div>
          </div>
        )}
        <div className="spacer-base" />
        {!!ep.sponsors?.length && (
          <div className="ep-mobile-only ep-sponsors-m">
            <div className="ep-rule-m" />
            <Sponsors ep={ep} className="" />
            <div className="ep-rule-m" />
          </div>
        )}
        {ep.story?.length ? (
          <>
            <Story story={ep.story} />
            {ep.deeper && <GoDeeper deeper={ep.deeper} />}
          </>
        ) : (
          <>
            {(ep.links || ep.carveOuts) && (
              <>
                <h2 className="ep-h2">More on this story</h2>
                <div className="rich">
                  {ep.links && (<><h2>Links</h2><ul>{ep.links.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: l.html }} />)}</ul></>)}
                  {ep.carveOuts && (<><h2>Picks</h2><ul>{ep.carveOuts.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: l.html }} />)}</ul></>)}
                </div>
              </>
            )}
            <p className="ep-disclaimer">Not investment advice. This story is for information and entertainment only.</p>
          </>
        )}
        {/* every story ends the same way: a rabbit hole to keep going, and a reason to come back tomorrow */}
        <StoryEnd slug={ep.slug} connects={connects} pool={pool} />
      </div>
    </main>
  );
}
