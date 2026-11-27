/* What this reader has already met, shared by Discover (home deck), story pages and the Library.
   Kept in this browser (localStorage) until there are accounts. */
export type SeenState = "skip" | "save" | "open" | "read"; // open = started, read = reached the end
export type Seen = Record<string, { s: SeenState; t: number }>;

const KEY = "scrollbook:seen";
const RANK: Record<SeenState, number> = { skip: 0, save: 1, open: 2, read: 3 }; // a stronger signal is never downgraded

export function loadSeen(): Seen {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export function markSeen(slug: string, s: SeenState) {
  const all = loadSeen();
  const prev = all[slug];
  all[slug] = { s: prev && RANK[prev.s] > RANK[s] ? prev.s : s, t: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

/** Undo support: forget a skip/save, but only if that's still all we know about the story. */
export function forget(slug: string, s: SeenState) {
  const all = loadSeen();
  if (all[slug]?.s !== s) return;
  delete all[slug];
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}
