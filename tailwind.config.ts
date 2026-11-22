import type { Config } from "tailwindcss";

// Every value maps to a CSS variable in styles/tokens.css — no raw values here.
const v = (name: string) => `var(--${name})`;
const scale = (prefix: string, keys: string[]) => Object.fromEntries(keys.map((k) => [k, v(`${prefix}-${k}`)]));

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      ink: v("c-ink"), cream: v("c-cream"), paper: v("c-paper"), teal: v("c-teal-1000"), accent: v("c-accent"),
      bg: v("bg"), fg: v("fg"), "fg-5": v("fg-5"), "fg-10": v("fg-10"), "fg-muted": v("fg-muted"), "fg-70": v("fg-70"),
    },
    fontFamily: { body: v("font-body"), serif: v("font-serif"), display: v("font-display"), sans: v("font-sans") },
    fontSize: scale("text", ["3xs", "2xs", "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"]),
    spacing: { 0: "0", ...scale("space", ["4xs", "3xs", "2xs", "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]), page: v("page-pad") },
    maxWidth: scale("w", ["3xs", "2xs", "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"]),
    borderRadius: scale("r", ["3xs", "2xs", "xs", "sm", "base", "lg", "xl", "full"]),
    lineHeight: { body: v("lh-body"), 140: v("lh-140"), snug: v("lh-snug"), tight: v("lh-tight"), none: v("lh-none") },
    letterSpacing: { body: v("track-body"), display: v("track-display") },
    screens: { mobile: { max: "479px" }, landscape: { max: "767px" }, tablet: { max: "991px" } },
    extend: {
      zIndex: { hero: v("z-hero"), content: v("z-content"), nav: v("z-nav"), popup: v("z-popup") },
      transitionTimingFunction: { soft: v("ease-out-soft"), popup: v("ease-popup") },
    },
  },
} satisfies Config;
