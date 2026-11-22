"use client";
import { useRef } from "react";
import { useDrift } from "@/lib/useDrift";

const FOOTER_FADE: [number, number] = [0.2, 0.5];

/** Frame + image with the live parallax drift. `fade` = footer variant (opacity 0.2 → 0.5 while scrolling in). */
export default function DriftImage({ src, alt, className, imgClassName, fade, children, ...rest }:
  { src: string; alt: string; className?: string; imgClassName?: string; fade?: boolean; children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  useDrift(img, frame, fade ? FOOTER_FADE : undefined);
  return (
    <div ref={frame} className={className} {...rest}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={src} alt={alt} loading="lazy" decoding="async" className={`drift-img ${imgClassName ?? ""}`} />
      {children}
    </div>
  );
}
