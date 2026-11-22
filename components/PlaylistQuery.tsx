"use client";
import { useSearchParams } from "next/navigation";
import PlaylistPage from "./PlaylistPage";
import type { EpisodeLite as Episode } from "@/lib/content";

/** Reads ?q= on the client; the server-rendered fallback is the unfiltered list, so the page paints without waiting for JS. */
export default function PlaylistQuery(props: { title: string; episodes: Episode[]; eyebrow?: string }) {
  const q = useSearchParams().get("q") ?? "";
  return <PlaylistPage {...props} query={q} />;
}
