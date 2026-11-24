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

export const episodes = episodesJson as Episode[];
export const getEpisode = (slug: string) => episodes.find((e) => e.slug === slug);
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
};
const scrollbookBooks = scrollbookData.books as unknown as Record<string, Partial<Book>>; // null in the JSON = remove that field
// Scrollbook-only stories (not podcast episodes): full entries in content/scrollbook.json → stories
const scrollbookStories = ((scrollbookData as unknown as { stories?: Record<string, Book> }).stories ?? {}); // null in the JSON = field removed
export const storySlugs = Object.keys(scrollbookStories);
export const getBook = (slug: string): Book | undefined => {
  const e = getEpisode(slug);
  return e ? { ...e, ...scrollbookBooks[slug] } : scrollbookStories[slug];
};
