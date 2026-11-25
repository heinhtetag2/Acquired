"use client";
import { useEffect } from "react";
import { markSeen } from "@/lib/seen";
import { logRead } from "@/lib/profile";

/** Opening a story page counts as reading it (Discover then deals it last; the Library tags it "Read";
    the profile counts it toward today's goal and your streak). */
export default function MarkRead({ slug }: { slug: string }) {
  useEffect(() => { markSeen(slug, "read"); logRead(slug); }, [slug]); // logRead feeds the profile's streak + week
  return null;
}
