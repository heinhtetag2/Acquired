"use client";
/* Highlights and comments on story text, kept in this browser (one list per story).
   A thread with no notes is a plain highlight; with notes it's a comment thread.
   Shared by the story page (StoryComments), the Shelf's "Notes" view and Discover's "Remember this?" cards. */

export type Note = { id: string; body: string; at: number };
export type Thread = { id: string; cid: string; start: number; end: number; quote: string; notes: Note[]; at?: number };
export type SlugThread = Thread & { slug: string };

const PREFIX = "scrollbook:comments:";
const OPEN_KEY = "scrollbook:open-note"; // which highlight to jump to when the story page opens
const EVT = "sb:notes";

export const uid = () => Math.random().toString(36).slice(2, 10);
/** when the highlight was made (older threads didn't store it: use the first note's time) */
export const createdAt = (t: Thread) => t.at ?? t.notes[0]?.at ?? 0;
/** the latest activity on a thread */
export const touchedAt = (t: Thread) => Math.max(createdAt(t), ...t.notes.map((n) => n.at));

export function loadThreads(slug: string): Thread[] {
  try { return JSON.parse(localStorage.getItem(PREFIX + slug) || "[]"); } catch { return []; }
}
export function saveThreads(slug: string, t: Thread[]) {
  try { if (t.length) localStorage.setItem(PREFIX + slug, JSON.stringify(t)); else localStorage.removeItem(PREFIX + slug); } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: slug }));
}
/** every highlight across every story, newest activity first */
export function allThreads(): SlugThread[] {
  const out: SlugThread[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) { const slug = k.slice(PREFIX.length); loadThreads(slug).forEach((t) => out.push({ ...t, slug })); }
    }
  } catch {}
  return out.sort((a, b) => touchedAt(b) - touchedAt(a));
}
export function onNotesChange(cb: () => void) {
  const onStorage = (e: StorageEvent) => { if (!e.key || e.key.startsWith(PREFIX)) cb(); };
  window.addEventListener(EVT, cb); window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", onStorage); };
}

/** ask the story page to scroll to a highlight and open it (survives a client-side navigation, unlike a #hash) */
export const openNoteLater = (id: string) => { try { sessionStorage.setItem(OPEN_KEY, id); } catch {} };
export function takeNoteToOpen(): string | null {
  let id: string | null = null;
  try { id = sessionStorage.getItem(OPEN_KEY); sessionStorage.removeItem(OPEN_KEY); } catch {}
  if (!id && location.hash.startsWith("#note-")) id = location.hash.slice(6);
  return id;
}
