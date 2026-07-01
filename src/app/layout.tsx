import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velocity eSIM | Global Travel Data",
  description:
    "Velocity eSIM helps travelers buy digital SIM plans for fast mobile data in 200+ destinations.",
  openGraph: {
    title: "Velocity eSIM",
    description:
      "Instant travel data for 200+ destinations. No physical SIM. No roaming surprises.",
    type: "website"
  }
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
