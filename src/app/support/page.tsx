import type { Metadata } from "next";
import { createMetadata, createWebPageJsonLd } from "@/lib/seo";
import { JsonLd } from "../JsonLd";
import { SupportPageClient } from "./SupportPageClient";

export const metadata: Metadata = createMetadata({
  path: "/support",
  title: "Support Center | Velocity eSIM",
  description:
    "Get help with Velocity eSIM app sign-in, Pokpay checkout, QR or manual eSIM setup, remaining data, top-ups, refunds, and connection troubleshooting."
});

export default function SupportPage() {
  return (
    <>
      <JsonLd
        data={createWebPageJsonLd({
          path: "/support",
          name: "Support Center",
          description:
            "Get help with Velocity eSIM app sign-in, Pokpay checkout, QR or manual eSIM setup, remaining data, top-ups, refunds, and connection troubleshooting.",
          breadcrumbName: "Support"
        })}
      />
      <SupportPageClient />
    </>
  );
}
