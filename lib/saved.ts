"use client";
import { useEffect, useState } from "react";
import { forget, markSeen } from "./seen";

/* The reader's saved stories (their Shelf), shared by every Save control: Discover's swipe-right,
   the story page's top Save button and the bottom bar's Save. Changes are broadcast so they all stay in sync. */
const KEY = "scrollbook:saved";
const EVT = "sb:saved";

export const loadSaved = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };

export function setSaved(slug: string, on: boolean) {
  const list = loadSaved().filter((s) => s !== slug);
  if (on) list.push(slug); // newest last
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  if (on) markSeen(slug, "save"); else forget(slug, "save");
  window.dispatchEvent(new CustomEvent(EVT, { detail: slug }));
}

/** [isSaved, toggle] for one story, kept in sync with every other Save control on the page. */
export function useSaved(slug: string | undefined): [boolean, () => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!slug) return;
    const read = () => setOn(loadSaved().includes(slug));
    read();
    window.addEventListener(EVT, read);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener(EVT, read); window.removeEventListener("storage", read); };
  }, [slug]);
  return [on, () => { if (slug) setSaved(slug, !on); }];
}
