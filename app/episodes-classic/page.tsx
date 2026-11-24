import type { Metadata } from "next";
import Playlist from "@/components/Playlist";
import { episodes } from "@/lib/content";

export const metadata: Metadata = { title: "All Episodes | Acquired Podcast (clone)" };

/** Classic Episodes: unchanged copy of the Episodes page, kept for reference while /episodes is redesigned. */
export default function EpisodesClassicPage() {
  return (
      <Playlist title="All Episodes" episodes={episodes} />
  );
}
