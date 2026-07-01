import type { Metadata } from "next";
import { policyDocument } from "@/content/legal";
import { LegalDocumentPage } from "../LegalDocumentPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Velocity eSIM",
  description: "Privacy Policy for Velocity eSIM travelers and app users."
};

export default function PolicyPage() {
  return <LegalDocumentPage document={policyDocument} />;
}
