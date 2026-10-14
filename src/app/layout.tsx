import type { Metadata } from "next";
import { Geist, Hanken_Grotesk, Inter } from "next/font/google";
import { createMetadata, siteUrl } from "@/lib/seo";
import { ConsentProvider } from "./ConsentManager";
import { GoogleTag } from "./GoogleTag";
import { MetaPixel } from "./MetaPixel";
import { Suspense } from "react";
import { OpenInAppBanner } from "./components/OpenInAppBanner";
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

// Not preloaded: font-mono is only used in the plan wizard and admin pages, and
// a high-priority preload competed with the homepage hero image (LCP).
const geist = Geist({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  preload: false
});

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

// Defaults only. Canonical and robots are left to each page: inherited here
// they would stamp the homepage canonical (and index, follow) onto every 404.
const { alternates: _alternates, robots: _robots, ...siteDefaults } = createMetadata({
  path: "/",
  title: "eSIM2you: Travel eSIMs for 200+ Destinations",
  description:
    "Buy a digital SIM for 200+ destinations, install it in minutes, and skip surprise roaming fees."
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...siteDefaults,
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
      <body
        className={`${hankenGrotesk.variable} ${inter.variable} ${geist.variable}`}
        suppressHydrationWarning
      >
        <ConsentProvider>
          <GoogleTag />
          <MetaPixel />
          {children}
          <Suspense fallback={null}>
            <OpenInAppBanner />
          </Suspense>
        </ConsentProvider>
      </body>
    </html>
  );
}
