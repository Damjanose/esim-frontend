import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xcryptoy",
  title: "Crypto Reviews | eSIM2you",
  description: "Private eSIM2you crypto payment review admin surface.",
  indexable: false
});

export default function AdminCryptoLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
