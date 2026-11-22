import { Suspense } from "react";
import PlaylistPage from "./PlaylistPage";
import PlaylistQuery from "./PlaylistQuery";
import { lite, type Episode } from "@/lib/content";

export default function Playlist({ episodes, ...rest }: { title: string; episodes: Episode[]; eyebrow?: string }) {
  const props = { ...rest, episodes: episodes.map(lite) };
  return (
    <Suspense fallback={<PlaylistPage {...props} />}>
      <PlaylistQuery {...props} />
    </Suspense>
  );
}
