"use client";
/* "Next" on a story you opened from Discover: back to the deck, one card on, so you choose what's next.
   When the deck opens a story it leaves a note here (which deck, its page, its shuffled order of stories);
   the story page's bottom bar reads it to know there is a next card, and moves the deck's place onto it. */
const RUN_KEY = "scrollbook:deck-run";
const HINT_KEY = "scrollbook:next-hint"; // "pending" after the first Next, "done" once the deck has explained it
const HINT_DEMO = true; // demo: show the hint after every Next (set false for real users: first time only)

/** The first time Next is used, the deck says once where you've landed ("Here's your next card…"). */
export function takeNextHint(): boolean {
  try { if (localStorage.getItem(HINT_KEY) !== "pending") return false; localStorage.setItem(HINT_KEY, "done"); return true; } catch { return false; }
}

type Run = { key: string; from: string; slugs: string[]; opened?: string };

const get = (): Run | null => { try { return JSON.parse(sessionStorage.getItem(RUN_KEY) || "null"); } catch { return null; } };

/** Called by the deck as it opens a story (`opened`). */
export function startRun(key: string, from: string, slugs: string[], opened: string) {
  try { sessionStorage.setItem(RUN_KEY, JSON.stringify({ key, from, slugs, opened })); } catch {}
}

/** If `slug` was opened from the deck: the deck page it came from (e.g. "/" or "/?c=finance") and whether it was
    the story the deck opened last (so a reload of that page, which forgets in-app history, still counts). */
export function runAt(slug: string): { from: string; opened: boolean } | null {
  const run = get();
  if (!run || !run.slugs.includes(slug)) return null;
  return { from: run.from, opened: run.opened === slug };
}

/** Move the deck's saved place to the card after `slug` (past the last card: the deck's "reshuffle" end);
    Undo in the deck steps back. */
export function advanceDeck(slug: string) {
  const run = get();
  if (!run) return;
  try {
    const st = JSON.parse(sessionStorage.getItem(run.key) || "null");
    const i = run.slugs.indexOf(slug);
    if (!st || i < 0) return;
    st.history = [...(st.history ?? []), { at: st.pos ?? 0, action: "skip" }];
    st.pos = Math.min(i + 1, run.slugs.length);
    sessionStorage.setItem(run.key, JSON.stringify(st));
    if (HINT_DEMO || !localStorage.getItem(HINT_KEY)) localStorage.setItem(HINT_KEY, "pending");
  } catch {}
}
