import type { Metadata } from "next";
import Studio from "@/components/scrollbook/Studio";

export const metadata: Metadata = { title: "Studio | Scrollbook", robots: { index: false, follow: false } };

/** The writing studio: for the people who make Scrollbook, not readers. Paste sources, get a story draft in the house style. */
export default function StudioRoute() { return <Studio />; }
