import type { Metadata } from "next";
import { policyDocument } from "@/content/legal";
import { createMetadata, createWebPageJsonLd } from "@/lib/seo";
import { JsonLd } from "../JsonLd";
import { LegalDocumentPage } from "../LegalDocumentPage";

export const metadata: Metadata = createMetadata({
  path: "/policy",
  title: "Privacy Policy | eSim2you",
  description: "Privacy Policy for eSim2you travelers and app users."
});

export default function PolicyPage() {
  return (
    <>
      <JsonLd
        data={createWebPageJsonLd({
          path: "/policy",
          name: "Privacy Policy",
          description: "Privacy Policy for eSim2you travelers and app users.",
          breadcrumbName: "Privacy Policy"
        })}
      />
      <LegalDocumentPage document={policyDocument} />
    </>
  );
}
