import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // separate output folder lets a production build run alongside `next dev`
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return [
      // the classic demo's Sponsor link (More menu)
      { source: "/sponsor", destination: "https://partner.acquired.fm/", statusCode: 301 },
      // old addresses: the Shelf was /episodes, and stories were /episodes/<slug>
      { source: "/episodes", destination: "/shelf", permanent: false },
      { source: "/episodes/:slug", destination: "/scrollbook/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
