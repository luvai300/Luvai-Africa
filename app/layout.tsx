import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luvai Africa — Art, Objects & Journeys",
  description: "Discover African art, handmade objects and considered journeys. Rooted in culture. Collected with purpose.",
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
