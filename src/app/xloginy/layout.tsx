import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xloginy",
  title: "Admin | Velocity eSIM",
  description: "Private Velocity eSIM admin surface.",
  indexable: false
});

export default function AdminDashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
