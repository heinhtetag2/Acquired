"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSeen } from "@/lib/seen";
import { dayKey } from "@/lib/profile";

/* The end of every story: the curiosity loop's last two steps.
   1 Rabbit hole: "This connects to…", two or three stories that lead on from this one (hand-picked, else the same category).
   2 Come back tomorrow: tomorrow's story, hook only, picked now and kept until tomorrow. Discover deals it first that day
     (Deck reads the same key), so the promise is kept. */

export type EndCard = { slug: string; title: string; art?: string; topic: string; hook?: string };

const TOMORROW_KEY = "scrollbook:tomorrow"; // { for: "yyyy-mm-dd", slug }
const tomorrowKey = () => { const d = new Date(); d.setDate(d.getDate() + 1); return dayKey(d); };

/** Today's promised story (set yesterday), if any: Discover deals it first. */
export function promisedToday(): string | null {
  try { const t = JSON.parse(localStorage.getItem(TOMORROW_KEY) || "null"); return t?.for === dayKey() ? t.slug : null; } catch { return null; }
}

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const MoonIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" {...ic} /></svg>);

export default function StoryEnd({ slug, connects, pool }: { slug: string; connects: EndCard[]; pool: EndCard[] }) {
  const [tomorrow, setTomorrow] = useState<EndCard | null>(null);

  useEffect(() => {
    const want = tomorrowKey();
    let pick: string | undefined;
    try { const t = JSON.parse(localStorage.getItem(TOMORROW_KEY) || "null"); if (t?.for === want) pick = t.slug; } catch {}
    if (!pick || pick === slug) {
      // something you haven't met, not this story or one it links to, with a hook to tease; stable for the day
      const seen = loadSeen();
      const skip = new Set([slug, ...connects.map((c) => c.slug)]);
      const fresh = pool.filter((c) => c.hook && !skip.has(c.slug) && !seen[c.slug]);
      const list = fresh.length ? fresh : pool.filter((c) => c.hook && !skip.has(c.slug));
      let h = 0; for (const ch of want) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      pick = list[h % Math.max(1, list.length)]?.slug;
      if (pick) try { localStorage.setItem(TOMORROW_KEY, JSON.stringify({ for: want, slug: pick })); } catch {}
    }
    setTomorrow(pool.find((c) => c.slug === pick) ?? null);
  }, [slug, connects, pool]);

  return (
    <section className="se" aria-label="Keep going">
      {connects.length > 0 && (
        <div className="se__block">
          <h2 className="se__title">This connects to…</h2>
          <p className="se__sub">Go one step further down the rabbit hole.</p>
          <ul className="se__list">
            {connects.map((c) => (
              <li key={c.slug}>
                <Link prefetch={false} href={`/scrollbook/${c.slug}`} className="se__item">
                  <span className="se__art">{c.art && <img src={c.art} alt="" loading="lazy" />}</span>
                  <span className="se__text">
                    <span className="se__topic t-label-xs">{c.topic}</span>
                    <span className="se__name">{c.title}</span>
                    {c.hook && <span className="se__hook">{c.hook}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tomorrow && (
        <div className="se__tomorrow" aria-label="Tomorrow's story">
          <span className="se__tomorrow-art" aria-hidden>{tomorrow.art && <img src={tomorrow.art} alt="" loading="lazy" />}</span>
          <span className="se__tomorrow-text">
            <span className="se__tomorrow-eyebrow t-label-xs"><MoonIcon />Come back tomorrow</span>
            <span className="se__tomorrow-hook">{tomorrow.hook}</span>
            <span className="se__tomorrow-note">Tomorrow&rsquo;s story is waiting at the top of Discover.</span>
          </span>
        </div>
      )}
    </section>
  );
}
