import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xloginy",
  title: "Admin | eSIM2you",
  description: "Private eSIM2you admin surface.",
  indexable: false
});

export default function AdminDashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
