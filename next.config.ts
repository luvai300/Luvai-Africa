import type { NextConfig } from "next";

const cloudflareWorkersShim = "./vercel-cloudflare-workers-shim.ts";

const nextConfig: NextConfig = {
  // This repository also has a Cloudflare/Vinext deployment path. Vercel's
  // Next.js build cannot resolve Cloudflare's virtual workers module, so
  // map it to a build-only empty binding. The API route still reports that
  // its D1 database is unavailable at runtime unless a real DB is supplied.
  turbopack: {
    resolveAlias: {
      "cloudflare:workers": cloudflareWorkersShim,
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "cloudflare:workers": cloudflareWorkersShim,
    };
    return config;
  },
};

export default nextConfig;
