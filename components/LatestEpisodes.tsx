import Link from "next/link";
import type { Episode } from "@/lib/content";
import EpisodeCard from "./EpisodeCard";

export default function LatestEpisodes({ episodes }: { episodes: Episode[] }) {
  return (
    <section id="latest" aria-labelledby="latest-h">
      <div className="section-head" style={{ padding: "0 var(--page-pad)" }}>
        <h2 id="latest-h" className="t-h2">Latest Episodes</h2>
        <div className="spacer-4xs" />
        <p className="t-body-140" style={{ maxWidth: "var(--w-xl)" }}>New episodes come out about 8 times a year. Here are the most recent.</p>
      </div>
      <div className="latest__list">{episodes.map((ep) => <EpisodeCard key={ep.slug} ep={ep} />)}</div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-sm)" }}>
        <Link href="/episodes" className="btn btn--ghost">View All</Link>
      </div>
    </section>
  );
}
