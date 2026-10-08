import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xversion",
  title: "App Version | eSIM2you",
  description: "Private eSIM2you minimum app version admin surface.",
  indexable: false
});

export default function AdminVersionLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
