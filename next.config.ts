import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CMS ini sepenuhnya dinamis (session admin + API per-request dengan header cache CDN),
  // jadi Cache Components / PPR tidak dipakai.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
