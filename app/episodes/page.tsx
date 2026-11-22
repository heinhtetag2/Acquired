import type { Metadata } from "next";
import Playlist from "@/components/Playlist";
import { episodes } from "@/lib/content";

export const metadata: Metadata = { title: "All Episodes | Acquired Podcast (clone)" };

export default function EpisodesPage() {
  return (
      <Playlist title="All Episodes" episodes={episodes} />
  );
}
