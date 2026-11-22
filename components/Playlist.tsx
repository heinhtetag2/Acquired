import PlaylistPage from "./PlaylistPage";
import { lite, type Episode } from "@/lib/content";

export default function Playlist({ episodes, ...rest }: { title: string; episodes: Episode[]; eyebrow?: string }) {
  return <PlaylistPage {...rest} episodes={episodes.map(lite)} />;
}
