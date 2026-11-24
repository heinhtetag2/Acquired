"use client";
import { useSaved } from "@/lib/saved";

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Save pill at the end of the line under the story title (the bottom bar's Save is hidden until you scroll). */
export default function StorySave({ slug, title }: { slug: string; title: string }) {
  const [on, toggle] = useSaved(slug);
  return (
    <button type="button" className={`sb-save-btn${on ? " is-on" : ""}`} aria-pressed={on} onClick={toggle}
      aria-label={on ? `${title} is saved to your shelf. Tap to remove` : `Save ${title} to your shelf`} title={on ? "Saved" : "Save"}>
      <svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" {...ic} fill={on ? "currentColor" : "none"} /></svg>
      <span>{on ? "Saved" : "Save"}</span>
    </button>
  );
}
