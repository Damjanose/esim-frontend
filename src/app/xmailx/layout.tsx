import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xmailx",
  title: "Mailbox | eSIM2you",
  description: "Private eSIM2you admin mailbox.",
  indexable: false
});

export default function AdminMailLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
