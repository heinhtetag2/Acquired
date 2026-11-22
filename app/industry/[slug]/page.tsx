import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Playlist from "@/components/Playlist";
import { filters, getFilter, filterEpisodes } from "@/lib/content";

const GROUP = "industry";
export const dynamicParams = false;
export const generateStaticParams = () => filters.filter((f) => f.group === GROUP).map((f) => ({ slug: f.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const f = getFilter(GROUP, (await params).slug);
  return { title: f ? `${f.title} | Acquired Podcast (clone)` : "Not found" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const f = getFilter(GROUP, (await params).slug);
  if (!f) notFound();
  return (
      <Playlist title={f.title} eyebrow={f.eyebrow} episodes={filterEpisodes(f)} />
  );
}
