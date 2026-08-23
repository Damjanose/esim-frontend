import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xversion",
  title: "App Version | eSim2you",
  description: "Private eSim2you minimum app version admin surface.",
  indexable: false
});

export default function AdminVersionLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
