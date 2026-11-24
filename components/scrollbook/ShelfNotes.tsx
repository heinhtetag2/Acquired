"use client";
import Link from "next/link";
import { createdAt, openNoteLater, type SlugThread } from "@/lib/notes";
import type { ShelfItem } from "./ShelfPage";

/* Shelf → Notes: every highlight and comment from every story, grouped by story (most recent activity first).
   Tapping one opens the story at that passage with its thread open. */

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const MarkIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M14.5 5.5l4 4-8 8H6.5v-4z M12.5 7.5l4 4" {...ic} /><path d="M4.5 20.5h15" {...ic} /></svg>);
const CommentIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 5.5h14v10H10l-4 3.5v-3.5H5z" {...ic} /></svg>);

const day = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const time = (t: number) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function ShelfNotes({ threads, bySlug }: { threads: SlugThread[]; bySlug: Map<string, ShelfItem> }) {
  // group by story, keeping the order of each story's most recent note
  const groups: { slug: string; list: SlugThread[] }[] = [];
  for (const t of threads) {
    if (!bySlug.has(t.slug)) continue;
    const g = groups.find((x) => x.slug === t.slug);
    if (g) g.list.push(t); else groups.push({ slug: t.slug, list: [t] });
  }

  if (!groups.length) return (
    <div className="notes-empty">
      <p className="t-body">No notes yet.</p>
      <p className="t-body-140">While you read a story, select any line to <b>highlight</b> it or add a <b>comment</b>. They&rsquo;ll collect here, and now and then one comes back in Discover so it sticks.</p>
    </div>
  );

  return (
    <div className="notes">
      {groups.map(({ slug, list }) => {
        const s = bySlug.get(slug)!;
        return (
          <section key={slug} className="notes__story">
            <Link prefetch={false} href={`/scrollbook/${slug}`} className="notes__head">
              <span className="notes__art">{s.art && <img src={s.art} alt="" loading="lazy" />}</span>
              <span className="notes__title">{s.title}</span>
              <span className="notes__n t-label-xs">{list.length} {list.length === 1 ? "note" : "notes"}</span>
            </Link>
            <ul className="notes__list">
              {list.map((t) => {
                const last = t.notes[t.notes.length - 1];
                return (
                  <li key={t.id}>
                    <Link prefetch={false} href={`/scrollbook/${slug}#note-${t.id}`} className={`notes__item${last ? " is-comment" : " is-mark"}`} onClick={() => openNoteLater(t.id)}>
                      <span className="notes__kind t-label-xs">{last ? <><CommentIcon />Comment</> : <><MarkIcon />Highlight</>}</span>
                      <blockquote className="notes__quote"><span>{t.quote}</span></blockquote>
                      {last
                        ? <p className="notes__body t-body-140">{last.body}</p>
                        : null}
                      <span className="notes__meta t-label-xs">
                        {last ? <>You · {time(last.at)}{t.notes.length > 1 && <> · {t.notes.length} comments</>}</> : <>Highlighted {day(createdAt(t))}</>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
