import type { Metadata } from "next";
import { Geist, Hanken_Grotesk, Inter } from "next/font/google";
import { createMetadata, siteUrl } from "@/lib/seo";
import { GoogleTag } from "./GoogleTag";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sans"
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono"
});

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...createMetadata({
    path: "/",
    title: "eSim2you | Travel Data for 200+ Destinations",
    description:
      "Buy a digital SIM for 200+ destinations, install it in minutes, and skip surprise roaming fees."
  }),
  icons: {
    icon: [{ url: "/favicon.png", sizes: "48x48", type: "image/png" }],
    apple: [{ url: "/app-logo.png", sizes: "1024x1024", type: "image/png" }]
  },
  manifest: "/manifest.json",
  ...((googleSiteVerification || bingSiteVerification) && {
    verification: {
      ...(googleSiteVerification && { google: googleSiteVerification }),
      ...(bingSiteVerification && { other: { "msvalidate.01": bingSiteVerification } })
    }
  })
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleTag />
      </head>
      <body
        className={`${hankenGrotesk.variable} ${inter.variable} ${geist.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
