// Vercel-only build shim. The Cloudflare Sites/Vinext build uses the real
// `cloudflare:workers` binding and does not read this file.
export const env: { DB?: any } = {};
