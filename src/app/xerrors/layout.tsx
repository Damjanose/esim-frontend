import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xerrors",
  title: "Error Inbox | Velocity eSIM",
  description: "Private Velocity eSIM error inbox.",
  indexable: false
});

export default function AdminErrorsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
