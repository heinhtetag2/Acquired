"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Leaf that reads ?q= and reports it up. It sits in its own Suspense boundary (fallback null), so the
 *  server-rendered list hydrates in place instead of being re-created on the client. */
export default function PlaylistQuery({ onQuery }: { onQuery: (q: string) => void }) {
  const q = useSearchParams().get("q") ?? "";
  useEffect(() => onQuery(q), [q, onQuery]);
  return null;
}
