import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luvai Africa — Handmade by African Artisans",
  description:
    "Discover art and handmade objects from African artisans. Meet the maker, find your piece, or open your own shop.",
  applicationName: "Luvai Africa",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Luvai Africa",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: [
      { url: "/icons/brand-v2-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#654431",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
