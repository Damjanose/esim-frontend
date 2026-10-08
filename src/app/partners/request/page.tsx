import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/backend";
import { createMetadata } from "@/lib/seo";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";
import { deriveCountryOptions, mapPackagesPayload, type ApiPackage } from "@/services/packages";
import { AccountShell } from "../../components/AccountShell";
import { Navbar } from "../../components/Navbar";
import { SignOutButton } from "../../components/SignOutButton";
import { SiteFooter } from "../../SiteFooter";
import { partnerShellItems } from "../partnerShellItems";
import { PartnerRequestForm } from "./PartnerRequestForm";

export const metadata: Metadata = createMetadata({
  path: "/partners/request",
  title: "Become a partner | eSIM2you",
  description: "Apply for the eSIM2you partner program and earn commission on referred bookings.",
  indexable: false
});

export default async function PartnerRequestPage() {
  // middleware.ts already guarantees a session cookie is present by the time
  // this renders (see GUARDED_PREFIXES in route-guard.ts). This check exists
  // for a different reason: a visitor who already has a Partner row (any
  // status) belongs on the status page, not back on the request form.
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

  const packagesResult = await backendFetch<{ packages?: ApiPackage[] }>("/packages");
  const countries = packagesResult.ok
    ? deriveCountryOptions(mapPackagesPayload(packagesResult.data))
    : [];

  return (
    // overflow-x-clip, not -hidden: hidden would make <main> a scroll container and
    // the AccountShell sidebar would stop sticking.
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell
          footer={<SignOutButton appearance="nav" />}
          items={partnerShellItems(null)}
          label="Partner"
        >
          <Link
            className="inline-flex min-h-11 items-center gap-2 px-1 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk lg:hidden"
            href="/profile"
          >
            <ArrowLeft size={14} />
            Profile
          </Link>

          <h1 className="px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
            Become a partner
          </h1>
          <p className="mt-1 px-1 text-sm text-onSurfaceVariant">
            Tell us about your business and we&apos;ll review your request for the eSIM2you
            partner program.
          </p>

          <div className="mt-6 max-w-[720px] rounded-[20px] border border-outline/60 bg-surface p-5 shadow-brandCard sm:p-6">
            <PartnerRequestForm countries={countries} />
          </div>
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
