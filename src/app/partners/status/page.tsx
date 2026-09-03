import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock, FileWarning, PauseCircle, XCircle } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";

export const metadata: Metadata = createMetadata({
  path: "/partners/status",
  title: "Partner status | eSim2you",
  description: "Check the status of your eSim2you partner request.",
  indexable: false
});

// Mirrors the `Partner.status` values set across
// `E-SIM backend/src/services/partner.service.ts` (requestPartnerStatus,
// approvePartnerRequest, suspendPartner, cancelPartner, and the verify step).
type Partner = {
  status: "PendingApproval" | "Pending" | "Active" | "VerificationRequired" | "Suspended" | "Cancelled" | string;
  partnerType: string;
  promoCode: string | null;
};

const STATUS_COPY: Record<
  string,
  {
    icon: typeof Clock;
    title: string;
    body: string;
    action?: { href: string; label: string };
  }
> = {
  PendingApproval: {
    icon: Clock,
    title: "Your request is under review",
    body: "We're reviewing your partner request. We'll email you once a decision is made — usually within a few business days."
  },
  Pending: {
    icon: BadgeCheck,
    title: "You're approved",
    body: "Your partner request was approved. Finish verification to unlock withdrawals, or head to your dashboard to see your promo code and referrals.",
    action: { href: "/partners/dashboard", label: "Go to dashboard" }
  },
  Active: {
    icon: BadgeCheck,
    title: "You're an active partner",
    body: "Your account is verified and active. Track referrals, commission, and your wallet from your dashboard.",
    action: { href: "/partners/dashboard", label: "Go to dashboard" }
  },
  VerificationRequired: {
    icon: FileWarning,
    title: "Verification needed",
    body: "Before you can withdraw your balance, we need a bit more information to verify your account.",
    action: { href: "/partners/withdraw", label: "Verify your account" }
  },
  Suspended: {
    icon: PauseCircle,
    title: "Your partner account is suspended",
    body: "Your partner account is currently suspended and isn't earning commission. Contact support if you think this is a mistake."
  },
  Cancelled: {
    icon: XCircle,
    title: "Your partner account is cancelled",
    body: "Your partner account has been cancelled. Contact support if you'd like to discuss reinstating it."
  }
};

export default async function PartnerStatusPage() {
  const result = await fetchForPage<Partner>("/partners/me", "/partners/status");

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
          Partner status
        </h1>

        {!result.ok && result.status === 404 ? (
          <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline bg-white px-6 py-14 text-center shadow-brandCard">
            <p className="font-display text-xl font-black text-brandInk">
              You haven&apos;t applied yet
            </p>
            <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
              Apply to the eSim2you partner program to start earning commission on referred
              bookings.
            </p>
            <LinkButton className="mt-7" href="/partners/request">
              Apply now
              <ArrowRight size={16} />
            </LinkButton>
          </div>
        ) : !result.ok ? (
          <div className="mt-8 rounded-[18px] border border-amber-600/30 bg-amber-50 px-6 py-5">
            <p className="font-bold text-brandInk">We couldn&apos;t load your partner status</p>
            <p className="mt-1 text-sm text-amber-700">{result.message}</p>
          </div>
        ) : (
          <PartnerStatusCard partner={result.data} />
        )}
      </section>

      <SiteFooter />
    </main>
  );
}

function PartnerStatusCard({ partner }: { partner: Partner }) {
  const copy = STATUS_COPY[partner.status];

  if (!copy) {
    // Unknown/future status value — degrade gracefully rather than crashing.
    return (
      <div className="mt-8 rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
        <p className="font-display text-xl font-black text-brandInk">Status: {partner.status}</p>
        <p className="mt-2 text-sm text-onSurfaceVariant">
          Contact support if you have questions about your partner account.
        </p>
      </div>
    );
  }

  const Icon = copy.icon;

  return (
    <div className="mt-8 rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
      <span className="grid h-14 w-14 place-items-center rounded-[16px] border border-outline bg-mist text-brandBlue">
        <Icon size={26} />
      </span>
      <p className="mt-5 font-display text-xl font-black text-brandInk">{copy.title}</p>
      <p className="mt-2 max-w-[420px] text-sm text-onSurfaceVariant">{copy.body}</p>

      {partner.promoCode ? (
        <p className="mt-4 text-sm text-onSurfaceVariant">
          Your promo code: <span className="font-bold text-brandInk">{partner.promoCode}</span>
        </p>
      ) : null}

      {copy.action ? (
        <LinkButton className="mt-7" href={copy.action.href}>
          {copy.action.label}
          <ArrowRight size={16} />
        </LinkButton>
      ) : null}
    </div>
  );
}
