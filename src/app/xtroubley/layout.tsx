import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xtroubley",
  title: "Troubleshooting | eSIM2you",
  description: "Private eSIM2you assistant troubleshooting admin surface.",
  indexable: false
});

export default function AdminTroubleshootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
