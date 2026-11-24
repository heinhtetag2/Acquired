"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "../Icons";
import { previousOf } from "@/lib/navTrail";
import { deckImageReady, leftStoryPage, navigateWithTransition } from "@/lib/viewTransition";

/* The story page's top-left back button: named after where you came from and takes you back there
   (Discover by default, e.g. when the story was opened from a link). Back to Discover plays the
   reverse cover transition, so the cover shrinks into its deck card again. */
const LABELS: [RegExp, string][] = [
  [/^\/(\?|$)/, "Discover"],
  [/^\/episodes(\?|$)/, "Your shelf"],
  [/^\/library(\?|$)/, "Library"],
];
const labelOf = (path: string) => LABELS.find(([re]) => re.test(path))?.[1];

export default function StoryBack() {
  const router = useRouter();
  const here = usePathname(); // the story's path (the address bar can still show the previous page during this render)
  // read once on mount; on a client navigation the trail already holds where we came from
  const [target] = useState(() => {
    if (typeof window === "undefined") return { href: "/", label: "Discover" };
    const prev = previousOf(here);
    const label = prev && labelOf(prev);
    return label ? { href: prev!, label } : { href: "/", label: "Discover" };
  });

  return (
    <Link href={target.href} className="btn btn--back" data-bnav-anchor suppressHydrationWarning
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        navigateWithTransition(() => router.replace(target.href, { scroll: false }), leftStoryPage, deckImageReady);
      }}>
      <ArrowLeft /><span suppressHydrationWarning>{target.label}</span>
    </Link>
  );
}
