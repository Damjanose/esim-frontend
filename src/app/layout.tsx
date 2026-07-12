import type { Metadata } from "next";
import { createMetadata, siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...createMetadata({
    path: "/",
    title: "Velocity eSIM | Travel Data for 200+ Destinations",
    description:
      "Buy a digital SIM for 200+ destinations, install it in minutes, and skip surprise roaming fees."
  })
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
