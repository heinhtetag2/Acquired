"use client";
import { useEffect } from "react";
import { markSeen } from "@/lib/seen";

/** Opening a story page counts as reading it (Discover then deals it last; the Library tags it "Read"). */
export default function MarkRead({ slug }: { slug: string }) {
  useEffect(() => { markSeen(slug, "read"); }, [slug]);
  return null;
}
