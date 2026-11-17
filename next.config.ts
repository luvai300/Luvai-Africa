import type { NextConfig } from "next";
// The marketplace uses Supabase directly, so it runs on both Next.js/Vercel
// and Sites/Vinext without a Cloudflare module alias.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};
export default nextConfig;
