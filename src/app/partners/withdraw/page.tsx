import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { Navbar } from "../../components/Navbar";
import { SiteFooter } from "../../SiteFooter";
import { PayoutHistory, type PartnerPayoutSummary } from "./PayoutHistory";
import { VerificationForm } from "./VerificationForm";
import { WithdrawForm } from "./WithdrawForm";

export const metadata: Metadata = createMetadata({
  path: "/partners/withdraw",
  title: "Withdraw commission | eSim2you",
  description: "Withdraw your eSim2you partner commission balance via PayPal.",
  indexable: false
});

// Same subset of the raw `Partner` row (`E-SIM backend/prisma/schema.prisma`)
// used by `/partners/status`'s local `Partner` type, plus
// `commissionBalanceCents` since this page shows and gates on the amount
// that would be withdrawn.
type Partner = {
  status: string;
  commissionBalanceCents: number;
};

// Withdrawals aren't possible while `Suspended`/`Cancelled` (backend's
// `WithdrawalNotAllowedError`, `E-SIM backend/src/services/partnerPayout.service.ts`).
// Every other status can at least attempt a withdrawal — including
// `VerificationRequired`, which instead shows the verification form below.
const BLOCKED_STATUSES = new Set(["Suspended", "Cancelled"]);

export default async function PartnerWithdrawPage() {
  const [partnerResult, payoutsResult] = await Promise.all([
    fetchForPage<Partner>("/partners/me", "/partners/withdraw"),
    fetchForPage<{ payouts: PartnerPayoutSummary[] }>(
      "/partners/me/payouts",
      "/partners/withdraw"
    )
  ]);

  return (
    <main className="min-h-screen bg-surface text-onSurface">
      <Navbar />

      <section className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-28 lg:px-10">
        <Link
          className="inline-flex items-center gap-2 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk"
          href="/partners/dashboard"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>

        <h1 className="mt-7 font-display text-3xl font-black tracking-[-0.03em] text-brandInk sm:text-4xl">
          Withdraw commission
        </h1>

        {!partnerResult.ok && partnerResult.status === 404 ? (
          <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline bg-white px-6 py-14 text-center shadow-brandCard">
            <p className="font-display text-xl font-black text-brandInk">
              You haven&apos;t applied yet
            </p>
            <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
              Apply to the eSim2you partner program to start earning commission.
            </p>
            <LinkButton className="mt-7" href="/partners/request">
              Apply now
              <ArrowRight size={16} />
            </LinkButton>
          </div>
        ) : !partnerResult.ok ? (
          <div className="mt-8 rounded-[18px] border border-amber-600/30 bg-amber-50 px-6 py-5">
            <p className="font-bold text-brandInk">We couldn&apos;t load your partner account</p>
            <p className="mt-1 text-sm text-amber-700">{partnerResult.message}</p>
          </div>
        ) : BLOCKED_STATUSES.has(partnerResult.data.status) ? (
          <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline bg-white px-6 py-14 text-center shadow-brandCard">
            <p className="font-display text-xl font-black text-brandInk">
              Withdrawals aren&apos;t available
            </p>
            <p className="mt-2 max-w-[380px] text-sm text-onSurfaceVariant">
              Check your partner status to see what&apos;s next.
            </p>
            <LinkButton className="mt-7" href="/partners/status">
              View partner status
              <ArrowRight size={16} />
            </LinkButton>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {partnerResult.data.status === "VerificationRequired" ? (
              <VerificationForm />
            ) : null}

            <WithdrawForm commissionBalanceCents={partnerResult.data.commissionBalanceCents} />

            <PayoutHistory
              payouts={payoutsResult.ok ? payoutsResult.data.payouts : []}
              loadError={payoutsResult.ok ? null : payoutsResult.message}
            />
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
