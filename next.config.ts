import type { NextConfig } from "next";
// The marketplace uses Supabase directly, so it runs on both Next.js/Vercel
// and Sites/Vinext without a Cloudflare module alias.
const nextConfig: NextConfig = {};
export default nextConfig;
