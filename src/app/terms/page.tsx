import type { Metadata } from "next";
import { termsDocument } from "@/content/legal";
import { LegalDocumentPage } from "../LegalDocumentPage";

export const metadata: Metadata = {
  title: "Terms of Service | Velocity eSIM",
  description: "Terms of Service for Velocity eSIM travelers and app users."
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
