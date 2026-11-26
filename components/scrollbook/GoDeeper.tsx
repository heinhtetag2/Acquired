import Link from "next/link";

/* "Go deeper": after the story, more to read: the best articles on it elsewhere, then more stories on Scrollbook.
   Videos and TikToks open from the buttons at the top of the story, and sources live in a sheet there too,
   so they aren't repeated here. Every link opens the original; nothing is copied.
   Data: `deeper` on a story in content/scrollbook.json. */

export type Deeper = {
  updated?: string;
  watch?: { id: string; title: string; channel: string; note?: string }[]; // shown as the YouTube button at the top
  tiktok?: { id: string; account: string; caption: string }[];             // shown as the TikTok button at the top
  listen?: { title: string; show: string; note?: string; spotify?: string; apple?: string; url?: string }[]; // kept in the data, not shown
  read?: { title: string; publisher: string; url: string; note?: string }[];
  sources?: { label: string; url: string }[];
};
export type MoreStory = { slug: string; title: string; art?: string; topic: string };

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const OutIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M8 16 16.5 7.5M9.5 7.5h7v7" {...ic} /></svg>);

export default function GoDeeper({ deeper, more = [] }: { deeper: Deeper; more?: MoreStory[] }) {
  const { read = [] } = deeper;
  if (!read.length && !more.length) return null;
  return (
    <section className="gd" aria-labelledby="gd-title">
      <div className="gd__head">
        <h2 id="gd-title" className="ep-h2">Go deeper</h2>
        <p className="gd__lead">More to read, picked for this story.{deeper.updated && <span className="t-label-xs"> · Updated {deeper.updated}</span>}</p>
      </div>

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
