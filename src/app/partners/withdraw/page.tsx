import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LinkButton } from "@/app/components/Button";
import { createMetadata } from "@/lib/seo";
import { fetchForPage } from "@/lib/server-session";
import { AccountShell } from "../../components/AccountShell";
import { Navbar } from "../../components/Navbar";
import { SignOutButton } from "../../components/SignOutButton";
import { SiteFooter } from "../../SiteFooter";
import { partnerShellItems } from "../partnerShellItems";
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
    // overflow-x-clip, not -hidden: hidden would make <main> a scroll container and
    // the AccountShell sidebar would stop sticking.
    <main className="min-h-screen overflow-x-clip bg-surfaceBright text-onSurface">
      <Navbar />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]">
        <AccountShell
          footer={<SignOutButton appearance="nav" />}
          items={partnerShellItems("withdraw")}
          label="Partner"
        >
          <Link
            className="inline-flex min-h-11 items-center gap-2 px-1 text-xs font-black text-onSurfaceVariant transition hover:text-brandInk lg:hidden"
            href="/partners/dashboard"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>

          <h1 className="px-1 font-display text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-brandInk lg:text-4xl">
            Withdraw commission
          </h1>

          {!partnerResult.ok && partnerResult.status === 404 ? (
            <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline/60 bg-surface px-6 py-14 text-center shadow-brandCard">
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
            <div className="mt-8 rounded-[18px] border border-error/30 bg-surface px-6 py-5 shadow-brandCard">
              <p className="font-bold text-brandInk">We couldn&apos;t load your partner account</p>
              <p className="mt-1 text-sm text-error">{partnerResult.message}</p>
            </div>
          ) : BLOCKED_STATUSES.has(partnerResult.data.status) ? (
            <div className="mt-8 flex flex-col items-center rounded-[20px] border border-outline/60 bg-surface px-6 py-14 text-center shadow-brandCard">
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
            <div className="mt-6 max-w-[720px] space-y-4 lg:mt-8 lg:space-y-5">
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
        </AccountShell>
      </div>

      <SiteFooter />
    </main>
  );
}
