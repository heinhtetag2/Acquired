// Reads numeric motion tokens from styles/tokens.css so GSAP timings live in one place.
export const cssNum = (name: string, fallback: number) => {
  if (typeof window === "undefined") return fallback;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
};
