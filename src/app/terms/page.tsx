import type { Metadata } from "next";
import { termsDocument } from "@/content/legal";
import { createMetadata, createWebPageJsonLd } from "@/lib/seo";
import { JsonLd } from "../JsonLd";
import { LegalDocumentPage } from "../LegalDocumentPage";

export const metadata: Metadata = createMetadata({
  path: "/terms",
  title: "Terms of Service | Velocity eSIM",
  description: "Terms of Service for Velocity eSIM travelers and app users."
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={createWebPageJsonLd({
          path: "/terms",
          name: "Terms of Service",
          description: "Terms of Service for Velocity eSIM travelers and app users.",
          breadcrumbName: "Terms"
        })}
      />
      <LegalDocumentPage document={termsDocument} />
    </>
  );
}
