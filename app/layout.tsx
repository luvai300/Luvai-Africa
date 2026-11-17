import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luvai Africa — Handmade by African Artisans",
  description:
    "Discover art and handmade objects from African artisans. Meet the maker, find your piece, or open your own shop.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
