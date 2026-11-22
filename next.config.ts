import type { NextConfig } from "next";

// /media-kit, /sponsor and /slack are redirects on the live site, not pages.
const nextConfig: NextConfig = {
  devIndicators: false,
  // separate output folder lets a production build run alongside `next dev`
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return [
      { source: "/media-kit", destination: "https://www.dropbox.com/scl/fo/c6277ypvybj7ksrvzlyyc/AJG_wvJyrUWgy_YVJjU0hYk?rlkey=robtbuohgcz686rweh4nudtpo&dl=0", statusCode: 301 },
      { source: "/sponsor", destination: "https://partner.acquired.fm/", statusCode: 301 },
      { source: "/slack", destination: "https://join.slack.com/t/acquiredfm/shared_invite/zt-43ie5ts1h-Rmm6gOU5dnSy12P_XIPL_w", statusCode: 301 },
    ];
  },
};

export default nextConfig;
