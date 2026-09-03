import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/backend";
import { createMetadata } from "@/lib/seo";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { PartnerRequestForm } from "./PartnerRequestForm";

export const metadata: Metadata = createMetadata({
  path: "/partners/request",
  title: "Become a partner | eSim2you",
  description: "Apply for the eSim2you partner program and earn commission on referred bookings.",
  indexable: false
});

export default async function PartnerRequestPage() {
  // A visitor who already has a Partner row (any status) belongs on the
  // status page, not back on the request form — check without forcing a
  // sign-in redirect here, since a signed-out visitor should still be able
  // to see the form (they'll be sent to sign in on submit instead).
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const existing = await backendFetch<unknown>("/partners/me", { token: accessToken });
    if (existing.ok) {
      redirect("/partners/status");
    }
    // An expired access token (401) with a refresh token still available is
    // worth refreshing before giving up — otherwise an existing partner with
    // a stale token would incorrectly see the request form instead of being
    // routed to their status page.
    if (existing.status === 401 && refreshToken) {
      redirect(`/bff/auth/refresh?next=${encodeURIComponent("/partners/request")}`);
    }
  } else if (refreshToken) {
    redirect(`/bff/auth/refresh?next=${encodeURIComponent("/partners/request")}`);
  }

  return (
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-28 lg:px-10">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
          href="/profile"
        >
          <ArrowLeft size={14} />
          Profile
        </Link>

        <h1 className="mt-7 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
          Become a partner
        </h1>
        <p className="mt-2 text-sm text-onSurfaceVariant">
          Tell us about your business and we&apos;ll review your request for the eSim2you
          partner program.
        </p>

        <div className="mt-8 rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
          <PartnerRequestForm />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
