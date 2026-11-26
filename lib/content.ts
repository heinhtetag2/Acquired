import episodesJson from "@/content/episodes.json";
import { site } from "./site";

export type Episode = {
  slug: string; title: string; date: string; isNew?: boolean; duration?: string;
  season?: number; episode?: number; color: string; theme: string; description: string;
  industry: string[]; features: string[]; spotify?: string; apple?: string; image?: string; imageAnimated?: boolean; cover?: string; tagline?: string;
  subtitle?: string; thumb?: string; seasonCode?: string; video?: boolean; heroLine?: string; vinyl?: string; hasTranscript?: boolean;
  themeColors?: { light: string; dark: string; a400: string; a500: string; a600: string }; seasonLabel?: string; seasonHref?: string; tags?: { label: string; href: string }[];
  youtube?: string; netflix?: string; audioSrc?: string; durationSec?: number; overview?: string[];
  presentedBy?: { label: string; href: string }; sponsors?: string[]; artifacts?: string[];
  links?: { html: string }[]; carveOuts?: { html: string }[]; chapters?: [number, string][];
  sources?: [string, number][]; companion?: { title: string; copy: string; pages?: string[] }; related?: string[];
};

// Episodes about the podcast itself (anniversaries, live shows, holiday specials, crossovers with other shows) aren't stories:
// they're left out everywhere. Titles lose their show framing ("Special: …", "(Acquired's Version)").
const SHOW_META = /\bAcquired\b(?![’']s Version)|\bACQ\b|Holiday Special|Special Episode|Review and \d{4} Predictions/;
const storyTitle = (t: string) => t.replace(/\s*\(Acquired[’']s Version\)/, "").replace(/^Special:\s*/, "").trim();
export const episodes = (episodesJson as Episode[]).filter((e) => !SHOW_META.test(e.title)).map((e) => ({ ...e, title: storyTitle(e.title) }));
export const getEpisode = (slug: string) => episodes.find((e) => e.slug === slug);
// the classic (demo) pages, reachable from More: hero and latest lists, and the ACQ2 feed
export const heroEpisodes = site.heroOrder.map((s) => getEpisode(s)!).filter(Boolean);
export const latestEpisodes = site.latest.map((s) => getEpisode(s)!).filter(Boolean);
export { site };

export { formatDate, formatLongDate, formatStamp, formatTime, seasonLabel } from "./site";

import filtersJson from "@/content/filters.json";
export type Filter = { group: string; slug: string; href: string; eyebrow: string; title: string; episodes: string[] };
export const filters = filtersJson as Filter[];
export const getFilter = (group: string, slug: string) => filters.find((f) => f.group === group && f.slug === slug);
export const filterEpisodes = (f: Filter) => f.episodes.map((s) => getEpisode(s)).filter((e): e is Episode => !!e);

import acq2Json from "@/content/acq2.json";
import scrollbookData from "@/content/scrollbook.json";
export type Acq2Episode = Episode & { zone: "featured" | "side" | "grid" | "lp" };
export const acq2 = acq2Json as Acq2Episode[];
export const getAcq2 = (slug: string) => acq2.find((e) => e.slug === slug);

/** Fields client components need for lists, the player and the hero — keeps RSC payloads/bundles small. */
export type EpisodeLite = Pick<Episode, "slug" | "title" | "date" | "seasonCode" | "episode" | "video" | "thumb" | "image" | "cover" | "color" | "theme" | "themeColors" | "description" | "spotify" | "apple" | "audioSrc" | "durationSec" | "vinyl" | "heroLine" | "tagline" | "isNew">;
const LITE_KEYS = ["slug", "title", "date", "seasonCode", "episode", "video", "thumb", "image", "cover", "color", "theme", "themeColors", "description", "spotify", "apple", "audioSrc", "durationSec", "vinyl", "heroLine", "tagline", "isNew"] as const;
export const lite = (e: Episode): EpisodeLite => Object.fromEntries(LITE_KEYS.filter((k) => e[k] !== undefined).map((k) => [k, e[k]])) as EpisodeLite;

// Scrollbook: per-slug overrides from content/scrollbook.json, applied on /scrollbook pages only.
export type Article = { title: string; dek: string; min: number; at?: number };
export type Book = Episode & {
  articles?: Article[]; demoRead?: number;
  // the book's article, shown on the book page instead of the podcast blocks: headed sections of paragraphs, or a pull quote
  story?: ({ h: string; p: string[] } | { quote: string })[];
  facts?: { label: string; value: string }[]; // "Quick facts" card
  deeper?: import("@/components/scrollbook/GoDeeper").Deeper & { more?: string[] }; // "Go deeper": watch / listen / read / sources
  motion?: string; // a short silent looping video that plays over the cover (the still `image` stays as its poster)
};
const deckHook = new Map(scrollbookData.deck.map((d) => [d.slug, d.hook]));
const hooks = scrollbookData.hooks as Record<string, string>;
const scrollbookBooks = scrollbookData.books as unknown as Record<string, Partial<Book>>; // null in the JSON = remove that field
// Scrollbook-only stories (not podcast episodes): full entries in content/scrollbook.json → stories
const scrollbookStories = ((scrollbookData as unknown as { stories?: Record<string, Book> }).stories ?? {}); // null in the JSON = field removed
export const storySlugs = Object.keys(scrollbookStories);
/** Short display titles for stories whose episode title runs long ("Convoy (with CEO Dan Lewis)" → "Convoy"),
    used on cards and lists; the story page keeps the full title. */
const cardTitles = ((scrollbookData as unknown as { cardTitles?: Record<string, string> }).cardTitles ?? {});
export const shortTitle = (slug: string, title: string) => cardTitles[slug] ?? title;
/* The story data started life as podcast-episode records. Scrollbook shows none of the podcast parts:
   listen links, episode numbers, seasons, sponsors, transcripts, companion PDFs, the hosts' links and picks.
   Text that talks about the show itself ("on this episode", the hosts…) is dropped sentence by sentence. */
const PODCAST_FIELDS = ["spotify", "apple", "audioSrc", "durationSec", "duration", "episode", "season", "seasonCode", "seasonLabel", "seasonHref",
  "features", "presentedBy", "sponsors", "artifacts", "links", "carveOuts", "chapters", "sources", "companion", "hasTranscript", "vinyl", "netflix", "youtube"] as const;
const SHOW_TALK = /\b(acquired|acq2|ben gilbert|david rosenthal|ben and david|ben & david|podcast|this episode|the episode|today's episode|our episode|episode \d+|listen(ers)?|season \d+|our (guest|sponsor)|we (dive|talk|sit down|cover|tell|explore|discuss)|join(ed)? us)\b/i;
// the clone's dummy copy ("Sample overview written for the clone…", "Paste the real episode summary…") is dropped too
const DUMMY = /placeholder|paste the real|written for the clone|the live page|replace with the real|content\/episodes\.json|^sample\b/i;
const cleanText = (t?: string) => t && t.split(/(?<=[.!?])\s+/).filter((x) => !SHOW_TALK.test(x) && !DUMMY.test(x)).join(" ").trim() || undefined;
// until a story is written, its page leads with the card's one-line hook (a real fact) and says the full story is coming
const SOON = "The full Scrollbook story is being written. Swipe Discover for another one in the meantime.";
function asStory(e: Episode): Episode {
  const out = { ...e } as Record<string, unknown>;
  for (const k of PODCAST_FIELDS) delete out[k];
  const hook = deckHook.get(e.slug) ?? hooks[e.slug];
  out.description = cleanText(e.description) ?? cleanText(e.subtitle) ?? hook ?? "";
  for (const k of ["subtitle", "tagline", "heroLine"] as const) out[k] = cleanText(e[k]);
  const ov = e.overview?.map(cleanText).filter((p): p is string => !!p);
  out.overview = ov?.length ? ov : hook ? [hook, SOON] : [SOON];
  out.tags = e.tags?.filter((t) => !/^\/(features|season)\//.test(t.href));
  return out as Episode;
}
export const getBook = (slug: string): Book | undefined => {
  const e = getEpisode(slug);
  return e ? { ...asStory(e), ...scrollbookBooks[slug] } : scrollbookStories[slug];
};
