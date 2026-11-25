"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/* "Go deeper": after the story, the best of the rest of the internet on it, picked and explained in one place.
   Watch (plays right here) → Listen → Read → more stories on Scrollbook (sources live in a sheet at the top). Every link opens the original;
   nothing is copied. Data: `deeper` on a story in content/scrollbook.json. */

export type Deeper = {
  updated?: string;
  watch?: { id: string; title: string; channel: string; note?: string }[];
  tiktok?: { id: string; account: string; caption: string }[]; // short vertical videos, checked to exist on the account
  listen?: { title: string; show: string; note?: string; spotify?: string; apple?: string; url?: string }[];
  read?: { title: string; publisher: string; url: string; note?: string }[];
  sources?: { label: string; url: string }[];
};
export type MoreStory = { slug: string; title: string; art?: string; topic: string };

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const PlayIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>);
const OutIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M8 16 16.5 7.5M9.5 7.5h7v7" {...ic} /></svg>);
const SpotifyIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" {...ic} /><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.5c2.5-.7 5.3-.4 7.4.8M8.6 15.3c1.9-.5 3.9-.3 5.6.6" {...ic} /></svg>);
const PodIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="10" r="2.5" {...ic} /><path d="M12 13v6M7.5 15a6 6 0 1 1 9 0" {...ic} /></svg>);

function Video({ v }: { v: NonNullable<Deeper["watch"]>[number] }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="gd-video">
      <div className="gd-video__frame">
        {playing ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`} title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        ) : (
          <button type="button" className="gd-video__poster" onClick={() => setPlaying(true)} aria-label={`Play: ${v.title}`}>
            <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" />
            <span className="gd-video__play"><PlayIcon /></span>
          </button>
        )}
      </div>
      <figcaption>
        <span className="gd-title">{v.title}</span>
        <span className="gd-meta t-label-xs">{v.channel}{v.note ? ` · ${v.note}` : ""}</span>
      </figcaption>
    </figure>
  );
}

const TikTokIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M14.5 3.5c.4 2.4 1.9 4 4.5 4.3v3c-1.7 0-3.2-.5-4.5-1.4v6.1a5 5 0 1 1-5-5h.5v3.1a2 2 0 1 0 1.5 1.9V3.5z" fill="currentColor" /></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M7 7l10 10M17 7 7 17" {...ic} /></svg>);
type Tik = NonNullable<Deeper["tiktok"]>[number];

/** a TikTok opened over the page in a phone-shaped player, with a way out to the app */
function TikTokPlayer({ t, onClose }: { t: Tik; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("bnav-lock");
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.classList.remove("bnav-lock"); };
  }, [onClose]);
  return (
    <div className="gd-tt-modal" role="dialog" aria-modal="true" aria-label={`TikTok from @${t.account}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gd-tt-modal__box">
        <iframe src={`https://www.tiktok.com/player/v1/${t.id}?autoplay=1&music_info=1&description=1&rel=0`} title={t.caption}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
      </div>
      <div className="gd-tt-modal__bar">
        <a href={`https://www.tiktok.com/@${t.account}/video/${t.id}`} target="_blank" rel="noreferrer" className="gd-tt-modal__open t-label-xs"><TikTokIcon />Open in TikTok</a>
        <button type="button" className="gd-tt-modal__close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
      </div>
    </div>
  );
}

export default function GoDeeper({ deeper, more = [] }: { deeper: Deeper; more?: MoreStory[] }) {
  const { watch = [], tiktok = [], listen = [], read = [] } = deeper; // sources open from the button at the top of the story
  const [tik, setTik] = useState<Tik | null>(null);
  return (
    <section className="gd" aria-labelledby="gd-title">
      <div className="gd__head">
        <h2 id="gd-title" className="ep-h2">Go deeper</h2>
        <p className="gd__lead">The best of the rest: watch, listen and read more, picked for this story.{deeper.updated && <span className="t-label-xs"> · Updated {deeper.updated}</span>}</p>
      </div>

      {watch.length > 0 && (
        <div className="gd__block">
          <div className="gd__label t-label-xs">Watch</div>
          <div className="gd-videos">{watch.map((v) => <Video key={v.id} v={v} />)}</div>
        </div>
      )}

      {tiktok.length > 0 && (
        <div className="gd__block">
          <div className="gd__label t-label-xs">Trending on TikTok</div>
          <div className="gd-tts">
            {tiktok.map((t) => (
              <button key={t.id} type="button" className="gd-tt" onClick={() => setTik(t)} aria-label={`Play TikTok from @${t.account}: ${t.caption}`}>
                <span className="gd-tt__logo"><TikTokIcon /></span>
                <span className="gd-tt__play"><PlayIcon /></span>
                <span className="gd-tt__cap">{t.caption}</span>
                <span className="gd-tt__acct t-label-xs">@{t.account}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {tik && <TikTokPlayer t={tik} onClose={() => setTik(null)} />}

      {listen.length > 0 && (
        <div className="gd__block">
          <div className="gd__label t-label-xs">Listen</div>
          <ul className="gd-list">
            {listen.map((l) => (
              <li key={l.title} className="gd-pod">
                <span className="gd-pod__icon" aria-hidden><PodIcon /></span>
                <span className="gd-pod__text"><span className="gd-title">{l.title}</span><span className="gd-meta t-label-xs">{l.show}{l.note ? ` · ${l.note}` : ""}</span></span>
                <span className="gd-pod__links">
                  {l.spotify && <a className="gd-round" href={l.spotify} target="_blank" rel="noreferrer" aria-label={`${l.title} on Spotify`}><SpotifyIcon /></a>}
                  {l.apple && <a className="gd-round" href={l.apple} target="_blank" rel="noreferrer" aria-label={`${l.title} on Apple Podcasts`}><PodIcon /></a>}
                  {l.url && <a className="gd-round" href={l.url} target="_blank" rel="noreferrer" aria-label={`Listen to ${l.title}`}><OutIcon /></a>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {read.length > 0 && (
        <div className="gd__block">
          <div className="gd__label t-label-xs">Read</div>
          <ul className="gd-list">
            {read.map((r) => (
              <li key={r.url}>
                <a className="gd-read" href={r.url} target="_blank" rel="noreferrer">
                  <span className="gd-meta t-label-xs">{r.publisher}</span>
                  <span className="gd-title">{r.title}</span>
                  {r.note && <span className="gd-note">{r.note}</span>}
                  <span className="gd-read__out" aria-hidden><OutIcon /></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}


      {more.length > 0 && (
        <div className="gd__block">
          <div className="gd__label t-label-xs">More on Scrollbook</div>
          <div className="gd-more">
            {more.map((m) => (
              <Link key={m.slug} href={`/scrollbook/${m.slug}`} className="gd-more__item">
                <span className="gd-more__art">{m.art && <img src={m.art} alt="" loading="lazy" />}</span>
                <span className="gd-meta t-label-xs">{m.topic}</span>
                <span className="gd-more__title">{m.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
