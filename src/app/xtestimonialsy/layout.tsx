import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  path: "/xtestimonialsy",
  title: "Testimonials | eSim2you",
  description: "Private eSim2you testimonial moderation.",
  indexable: false
});

export default function AdminTestimonialsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
