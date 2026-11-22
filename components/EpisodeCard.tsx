import Link from "next/link";
import { formatDate, type Episode } from "@/lib/content";
import { PlayIcon, SpotifyIcon, PodcastIcon } from "./Icons";

export function EpisodeArt({ ep }: { ep: Episode }) {
  const src = ep.image ?? ep.cover;
  return src
    ? <img src={src} alt="" loading="lazy" />
    : <div className="ep-card__art-ph" style={{ background: ep.color }} aria-hidden>{ep.title}</div>;
}

export default function EpisodeCard({ ep }: { ep: Episode }) {
  return (
    <article className="ep-card">
      <div className="ep-card__art"><EpisodeArt ep={ep} /></div>
      <div className="ep-card__head">
        <h3 className="t-h3 ep-card__title"><Link href={`/episodes/${ep.slug}`}>{ep.title}</Link></h3>
        <div className="t-label ep-card__meta">
          {ep.isNew && <span>New release ·</span>}<time dateTime={ep.date}>{formatDate(ep.date)}</time>
        </div>
      </div>
      <p className="t-body-140 ep-card__desc">{ep.description}</p>
      <div className="ep-card__acts">
        <div className="ep-card__links">
          {ep.spotify && <a className="icon-btn" href={ep.spotify} target="_blank" rel="noreferrer" aria-label={`${ep.title} on Spotify`}><SpotifyIcon /></a>}
          {ep.apple && <a className="icon-btn" href={ep.apple} target="_blank" rel="noreferrer" aria-label={`${ep.title} on Apple Podcasts`}><PodcastIcon /></a>}
        </div>
        <Link href={`/episodes/${ep.slug}`} className="play-pill" aria-label={`Play ${ep.title}`}>
          <PlayIcon /><span className="play-pill__time t-label"><span>{ep.duration}</span></span>
        </Link>
      </div>
    </article>
  );
}
