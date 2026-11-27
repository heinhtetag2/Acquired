"use client";
import { useEffect } from "react";
import { markSeen } from "@/lib/seen";

/** Opening a story marks it as started (Discover then deals it later). It only counts as read, for the Shelf, your goal,
    your streak and the free allowance, once you reach its end: see ReadEnd. */
export default function MarkRead({ slug }: { slug: string }) {
  useEffect(() => { markSeen(slug, "open"); }, [slug]);
  return null;
}
