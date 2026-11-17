import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "./market-config";
export const CATEGORIES = [
  "All pieces",
  "Basketry",
  "Ceramics",
  "Jewellery",
  "Woodwork",
  "Textiles",
  "Paintings",
  "Sculpture",
  "Other",
] as const;
export type Artisan = {
  id: string;
  slug: string;
  shop_name: string;
  maker_name: string;
  location: string;
  bio: string;
  phone: string;
  created_at: string;
};
export type Product = {
  id: string;
  artisan_id: string;
  title: string;
  description: string;
  category: string;
  price_minor: number;
  currency: string;
  materials: string;
  dimensions: string;
  images: string[];
  status: "draft" | "published" | "sold" | "archived";
  made_to_order: boolean;
  created_at: string;
  updated_at: string;
  artisan?: Artisan;
};
let client: SupabaseClient | undefined;
export function market(): SupabaseClient {
  return (client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storageKey: "luvai-africa-auth-v1",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }));
}
export function photo(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/luvai-products/${path}`;
}
export function price(p: Pick<Product, "price_minor" | "currency">) {
  return `${p.currency} ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(p.price_minor / 100)}`;
}
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
export function whatsapp(p: Product) {
  return `https://wa.me/${p.artisan?.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${p.artisan?.shop_name}, I found your ${p.title} on Luvai Africa (${price(p)}). Is it available? ${typeof window !== "undefined" ? window.location.origin : ""}/?piece=${p.id}`)}`;
}
export function humanError(e: unknown) {
  const m =
    (e as { message?: string })?.message ||
    "Something went wrong. Please try again.";
  if (/Failed to fetch|NetworkError/i.test(m))
    return "We could not connect. Check your connection and try again.";
  if (/rate limit|too many requests|email.*limit/i.test(m))
    return "Too many attempts. Please wait a few minutes before trying again.";
  if (/Invalid login/i.test(m))
    return "Your email or password is incorrect. If you just registered, confirm your email first.";
  if (/luvai_reports.*key|duplicate key.*luvai_reports/i.test(m))
    return "You have already reported this piece. Thank you for letting us know.";
  if (/check constraint/i.test(m))
    return "Please check the length and format of your listing details, then try again.";
  if (/row-level security/i.test(m))
    return "Your session may have expired. Sign in again before saving.";
  return m;
}
export async function compressPhoto(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("Use a JPG, PNG or WebP photo.");
  if (file.size > 15 * 1024 * 1024)
    throw Error("Choose a photo smaller than 15 MB.");
  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > 80_000_000) {
    bitmap.close();
    throw Error("This photo is too large. Choose a smaller version.");
  }
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Photo processing is unavailable in this browser.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Error("Could not read this photo."))),
      "image/webp",
      0.83,
    ),
  );
  if (blob.size > 4 * 1024 * 1024)
    throw Error("This photo is still too large. Choose a smaller version.");
  return blob;
}
